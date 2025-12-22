import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { checkPlexPin, getDefaultPlexOptions } from "$lib/server/plex-oauth";

/**
 * Plex OAuth callback handler
 *
 * After the user authorizes on Plex, they're redirected here.
 * We:
 * 1. Validate the PIN was authorized
 * 2. Forward to Better Auth's generic OAuth callback with PIN as "code"
 *
 * This "fakes" the OAuth code exchange by passing our PIN info as the code,
 * which our custom getToken function will then process.
 */
export const GET: RequestHandler = async ({ cookies }) => {
    const storedDataStr = cookies.get("plex_auth_state");

    if (!storedDataStr) {
        console.error("Plex callback: No auth state cookie found");
        redirect(302, "/auth/login?error=state_not_found");
    }

    let storedData: {
        state: string;
        redirectUri: string | null;
        pinId: number;
        pinCode: string;
        expiresAt: string;
    };

    try {
        storedData = JSON.parse(storedDataStr);
    } catch {
        console.error("Plex callback: Failed to parse auth state cookie");
        redirect(302, "/auth/login?error=invalid_state");
    }

    cookies.delete("plex_auth_state", { path: "/" });

    const options = getDefaultPlexOptions(env);

    try {
        // Verify the PIN was authorized
        const pinStatus = await checkPlexPin(
            options,
            storedData.pinId.toString(),
            storedData.pinCode
        );

        if (!pinStatus.authToken) {
            console.error("Plex callback: PIN not authorized yet");
            redirect(302, "/auth/login?error=not_authorized");
        }

        // Forward to Better Auth's generic OAuth callback
        // The "code" is our PIN in format "pinId:pinCode" which getToken will process
        const origin = env.ORIGIN || "http://localhost:5173";
        const oauthCallbackUrl = new URL("/api/auth/oauth2/callback/plex", origin);
        oauthCallbackUrl.searchParams.set("code", `${storedData.pinId}:${storedData.pinCode}`);
        oauthCallbackUrl.searchParams.set("state", storedData.state);

        redirect(302, oauthCallbackUrl.toString());
    } catch (error) {
        // Re-throw redirect errors (they throw in SvelteKit, this is not necessarily an error, required for auth to work)
        if (error && typeof error === "object" && "status" in error) {
            throw error;
        }
        console.error("Plex callback error:", error);
        redirect(302, "/auth/login?error=callback_failed");
    }
};
