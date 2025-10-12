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
import { passkey } from "better-auth/plugins/passkey";

export const auth = betterAuth({
    database: new Database(DATABASE_URL),
    emailAndPassword: {
        enabled: true
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
