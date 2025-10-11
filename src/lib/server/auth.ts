////////////////////////////////////
// MAKE SURE TO KEEP THIS IN SYNC WITH better-auth.config.ts EXCEPT FOR SVELTE-KIT $ IMPORT
// AS IT IS USED FOR BETTER-AUTH CLI
//////////////////////////////////////

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { DATABASE_URL } from "$env/static/private";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { admin, openAPI } from "better-auth/plugins";
import { env } from "$env/dynamic/private";

export const auth = betterAuth({
    database: new Database(DATABASE_URL),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        plex: {
            clientId: env.PLEX_CLIENT_IDENTIFIER || "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: true
        }
    },
    plugins: [username(), admin(), openAPI(), sveltekitCookies(getRequestEvent)],
    advanced: {
        cookiePrefix: "riven"
    },
    telemetry: {
        enabled: false
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        }
    }
});
