////////////////////////////////////
// THIS IS JUST A COPY OF src/lib/server/auth.ts FILE
// IT'S MADE BECAUSE BETTER-AUTH CONFIG DOESN'T SUPPORT SVELTE-KIT $ IMPORT
// KEEP IT IN SYNC WITH src/lib/server/auth.ts EXCEPT FOR SVELTE-KIT $ IMPORT AND RELATED IMPORTS
////////////////////////////////////

import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { username } from "better-auth/plugins";
// import { sveltekitCookies } from 'better-auth/svelte-kit';
// import { getRequestEvent } from '$app/server';
import { admin, openAPI } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
    database: new Database(process.env.DATABASE_URL!),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        plex: {
            clientId: "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: true
        }
    },
    plugins: [
        username(), 
        admin(), 
        openAPI(), 
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
