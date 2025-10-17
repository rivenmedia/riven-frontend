////////////////////////////////////
// MAKE SURE TO KEEP THIS IN SYNC WITH better-auth.config.ts EXCEPT FOR SVELTE-KIT $ IMPORT
// AS IT IS USED FOR BETTER-AUTH CLI
//////////////////////////////////////

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { admin, openAPI } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
    database: new Database(env.DATABASE_URL),
    emailAndPassword: {
        enabled: env.DISABLE_EMAIL_PASSWORD === "true" ? false : true,
        disableSignUp: env.DISABLE_EMAIL_PASSWORD_SIGNUP === "true" || false
    },
    socialProviders: {
        plex: {
            clientId: "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: env.DISABLE_PLEX === "true" ? false : true,
            disableSignUp: env.DISABLE_PLEX_SIGNUP === "true" || false
        }
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://192.168.1.*:5173",
        process.env.PASSKEY_ORIGIN
    ].filter(Boolean) as string[],
    plugins: [
        username(),
        admin(),
        openAPI(),
        sveltekitCookies(getRequestEvent),
        passkey({
            rpID: process.env.PASSKEY_RP_ID || "localhost",
            rpName: process.env.PASSKEY_RP_NAME || "Riven Media",
            origin: process.env.PASSKEY_ORIGIN || "http://localhost:5173"
        })
    ],
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
