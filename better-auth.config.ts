////////////////////////////////////
// THIS IS JUST A COPY OF src/lib/server/auth.ts FILE
// IT'S MADE BECAUSE BETTER-AUTH CONFIG DOESN'T SUPPORT SVELTE-KIT $ IMPORT
// KEEP IT IN SYNC WITH src/lib/server/auth.ts EXCEPT FOR SVELTE-KIT $ IMPORT AND RELATED IMPORTS
////////////////////////////////////

import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
// import { sveltekitCookies } from 'better-auth/svelte-kit';
// import { getRequestEvent } from '$app/server';
import { admin as adminPlugin, openAPI, lastLoginMethod, genericOAuth } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey"
import { db } from "./src/lib/server/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ac, admin, user, manager } from "./src/lib/server/permissions";
import { getGenericOAuthProviders } from "./src/lib/server/oauth-utils";
import { plexOAuth } from "./src/lib/server/plex-oauth";
import "dotenv/config";

export const auth = betterAuth({
    secret: process.env.AUTH_SECRET,
    baseURL: process.env.ORIGIN,
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
            trustedProviders: [
                ...(process.env.DISABLE_PLEX !== "true" ? ["plex"] : []),
                ...getGenericOAuthProviders(process.env as Record<string, string>).map(
                    (p) => p.providerId
                )
            ]
        },
        encryptOAuthTokens: true
    },
    emailAndPassword: {
        enabled: process.env.DISABLE_EMAIL_PASSWORD !== "true",
        disableSignUp: process.env.ENABLE_EMAIL_PASSWORD_SIGNUP !== "true"
    },
    socialProviders: {},
    trustedOrigins: ["http://localhost:5173", "http://192.168.1.*:5173", process.env.ORIGIN].filter(
        Boolean
    ) as string[],
    plugins: [
        username(),
        adminPlugin({
            ac,
            roles: {
                admin,
                user,
                manager
            },
            defaultRole: "user",
            adminRoles: ["admin"]
        }),
        openAPI(),
        passkey({
            rpID: process.env.PASSKEY_RP_ID || "riven",
            rpName: process.env.PASSKEY_RP_NAME || "Riven Media",
            origin: process.env.ORIGIN || "http://localhost:5173"
        }),
        lastLoginMethod({
            storeInDatabase: true
        }),
        genericOAuth({
            config: [
                ...(process.env.DISABLE_PLEX !== "true" ? [plexOAuth({
                    clientId: process.env.PLEX_CLIENT_ID || "riven",
                    product: "Riven Media",
                    version: "1.0",
                    platform: "Web",
                    device: "Browser",
                    disableSignUp: process.env.ENABLE_PLEX_SIGNUP !== "true",
                    baseURL: process.env.ORIGIN || "http://localhost:5173",
                })] : []),
                ...getGenericOAuthProviders(process.env as Record<string, string>)
            ]
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