////////////////////////////////////
// MAKE SURE TO KEEP THIS IN SYNC WITH better-auth.config.ts EXCEPT FOR SVELTE-KIT $ IMPORT
// AS IT IS USED FOR BETTER-AUTH CLI
//////////////////////////////////////

import { betterAuth } from "better-auth";
import { env } from "$env/dynamic/private";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { admin, openAPI } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
    secret: env.AUTH_SECRET,
    baseURL: env.ORIGIN,
    database: drizzleAdapter(db, {
        provider: "sqlite"
    }),
    user: {
        changeEmail: {
            enabled: true
        },
        deleteUser: {
            enabled: true
        }
    },
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            trustedProviders: ["plex"]
        },
        encryptOAuthTokens: true
    },
    emailAndPassword: {
        enabled: env.DISABLE_EMAIL_PASSWORD !== "true",
        disableSignUp: env.DISABLE_EMAIL_PASSWORD_SIGNUP === "true"
    },
    socialProviders: {
        plex: {
            clientId: "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: env.DISABLE_PLEX !== "true",
            disableSignUp: env.DISABLE_PLEX_SIGNUP === "true"
        }
    },
    trustedOrigins: ["http://localhost:5173", "http://192.168.1.*:5173", env.PASSKEY_ORIGIN].filter(
        Boolean
    ) as string[],
    plugins: [
        username(),
        admin(),
        openAPI(),
        sveltekitCookies(getRequestEvent),
        passkey({
            rpID: env.PASSKEY_RP_ID || "localhost",
            rpName: env.PASSKEY_RP_NAME || "Riven Media",
            origin: env.PASSKEY_ORIGIN || "http://localhost:5173"
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
            maxAge: 1 * 60 // Cache duration in seconds
        }
    }
});
