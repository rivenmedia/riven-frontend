import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
	generateClientIdentifier,
	requestPlexPin,
	getPlexAuthUrl
} from "$lib/server/plex-oauth";
import { env } from "$env/dynamic/private";

export const GET: RequestHandler = async ({ url, cookies }) => {
	// Generate or retrieve client identifier
	const clientIdentifier = generateClientIdentifier();

	// Store client identifier in cookie for callback verification
	cookies.set("plex_client_id", clientIdentifier, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: !env.NODE_ENV || env.NODE_ENV === "production",
		maxAge: 60 * 10 // 10 minutes
	});

	// Request a PIN from Plex
	const pin = await requestPlexPin(clientIdentifier);

	// Store PIN ID in cookie for callback
	cookies.set("plex_pin_id", pin.id.toString(), {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: !env.NODE_ENV || env.NODE_ENV === "production",
		maxAge: 60 * 10 // 10 minutes
	});

	// Construct callback URL
	const protocol = url.protocol;
	const host = url.host;
	const callbackUrl = `${protocol}//${host}/auth/plex/callback`;

	// Construct Plex auth URL
	const authUrl = getPlexAuthUrl(pin.code, clientIdentifier, callbackUrl);

	// Redirect user to Plex authorization page
	throw redirect(302, authUrl);
};
