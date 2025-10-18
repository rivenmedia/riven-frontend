////////////////////////////////////
// THIS IS JUST A COPY OF src/lib/server/auth.ts FILE
// IT'S MADE BECAUSE BETTER-AUTH CONFIG DOESN'T SUPPORT SVELTE-KIT $ IMPORT
// KEEP IT IN SYNC WITH src/lib/server/auth.ts EXCEPT FOR SVELTE-KIT $ IMPORT AND RELATED IMPORTS
////////////////////////////////////

import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
// import { sveltekitCookies } from 'better-auth/svelte-kit';
// import { getRequestEvent } from '$app/server';
import { admin, openAPI } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./src/lib/server/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import "dotenv/config";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite"
    }),
    emailAndPassword: {
        enabled: process.env.DISABLE_EMAIL_PASSWORD === "true" ? false : true,
        disableSignUp: process.env.DISABLE_EMAIL_PASSWORD_SIGNUP === "true" || false
    },
    socialProviders: {
        plex: {
            clientId: "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: process.env.DISABLE_PLEX === "true" ? false : true,
            disableSignUp: process.env.DISABLE_PLEX_SIGNUP === "true" || false
        }
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://192.168.1.*:5173",
        process.env.BETTER_AUTH_URL
    ].filter(Boolean) as string[],
    plugins: [
        username(),
        admin(),
        openAPI(),
        passkey({
            rpID: process.env.PASSKEY_RP_ID || "riven",
            rpName: process.env.PASSKEY_RP_NAME || "Riven Media",
            origin: process.env.BETTER_AUTH_URL || "http://localhost:5173"
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
