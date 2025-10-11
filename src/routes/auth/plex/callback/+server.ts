import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { checkPlexPinStatus, getPlexUser } from "$lib/server/plex-oauth";
import { auth } from "$lib/server/auth";

export const GET: RequestHandler = async ({ cookies, request }) => {
	// try {
		// Retrieve client identifier and PIN ID from cookies
		const clientIdentifier = cookies.get("plex_client_id");
		const pinIdStr = cookies.get("plex_pin_id");

		if (!clientIdentifier || !pinIdStr) {
			console.error("Missing Plex OAuth cookies");
			throw redirect(
				302,
				`/auth/login?error=${encodeURIComponent("Invalid Plex authentication state")}`
			);
		}

		const pinId = parseInt(pinIdStr, 10);

		// Check PIN status to get auth token
		const pinStatus = await checkPlexPinStatus(pinId, clientIdentifier);

		if (!pinStatus.authToken) {
			console.error("Plex PIN not authorized yet");
			throw redirect(
				302,
				`/auth/login?error=${encodeURIComponent("Plex authentication not completed")}`
			);
		}

		// Get Plex user information
		const plexUser = await getPlexUser(pinStatus.authToken);

		// Check if user already exists with this Plex ID
		const username = plexUser.username || `plex_${plexUser.id}`;
		const email = plexUser.email || `${plexUser.id}@plex.user`;

		// Try to find existing user or create new one
		try {
			// First, try to sign in
			await auth.api.signInUsername({
				body: {
					username: username,
					password: plexUser.uuid // Use UUID as password verification
				},
				headers: request.headers
			});
		} catch (signInError) {
			// If sign in fails, create a new user
			try {
				const user = await auth.api.signUpEmail({
					body: {
						name: plexUser.title,
						username: username,
						displayUsername: plexUser.friendlyName,
						email: email,
						password: plexUser.uuid,
						image: plexUser.thumb
					}
				});

				// Sign in the newly created user
				await auth.api.signInUsername({
					body: {
						username: username,
						password: plexUser.uuid
					},
					headers: request.headers
				});
			} catch (createError) {
				const typedError = createError as { body?: { message: string } };
				console.error("Failed to create Plex user:", createError);
				throw redirect(
					302,
					`/auth/login?error=${encodeURIComponent("Failed to create user from Plex account" + (typedError?.body ? ": " + typedError.body.message : ''))}`
				);
			}
		}

		// Clear Plex OAuth cookies
		cookies.delete("plex_client_id", { path: "/" });
		cookies.delete("plex_pin_id", { path: "/" });

		// Redirect to home page
		throw redirect(303, "/");
	// } catch (error) {
	// 	const typedError = error as { body?: { message: string } };
	// 	console.error("Plex OAuth callback error:", error);

	// 	// If it's already a redirect, re-throw it
	// 	if (error instanceof Response && error.status >= 300 && error.status < 400) {
	// 		throw error;
	// 	}

	// 	throw redirect(
	// 		302,
	// 		`/auth/login?error=${encodeURIComponent("Plex authentication failed" + (typedError?.body ? ": " + typedError.body.message : ''))}`
	// 	);
	// }
};
