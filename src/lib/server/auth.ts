////////////////////////////////////
// MAKE SURE TO KEEP THIS IN SYNC WITH better-auth.config.ts EXCEPT FOR SVELTE-KIT $ IMPORT
// AS IT IS USED FOR BETTER-AUTH CLI
//////////////////////////////////////

import { betterAuth } from "better-auth";
import { env } from "$env/dynamic/private";
import { username } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { admin as adminPlugin, openAPI, lastLoginMethod, genericOAuth } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ac, admin, user, manager } from "./permissions";
import { getGenericOAuthProviders } from "./oauth-utils";
import { plexOAuth } from "./plex-oauth";
import { generateSecret } from "$lib/helpers";

export const auth = betterAuth({
    secret: env.AUTH_SECRET || generateSecret(),
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
            trustedProviders: [
                ...(env.DISABLE_PLEX !== "true" ? ["plex"] : []),
                ...getGenericOAuthProviders(env).map((p) => p.providerId)
            ]
        },
        encryptOAuthTokens: true
    },
    emailAndPassword: {
        enabled: env.DISABLE_EMAIL_PASSWORD !== "true",
        disableSignUp: env.ENABLE_EMAIL_PASSWORD_SIGNUP !== "true"
    },
    socialProviders: {},
    trustedOrigins: ["http://localhost:5173", "http://192.168.1.*:5173", env.ORIGIN].filter(
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
        sveltekitCookies(getRequestEvent),
        passkey({
            rpID: env.PASSKEY_RP_ID || "riven",
            rpName: env.PASSKEY_RP_NAME || "Riven Media",
            origin: env.ORIGIN || "http://localhost:5173"
        }),
        lastLoginMethod({
            storeInDatabase: true
        }),
        genericOAuth({
            config: [
                ...(env.DISABLE_PLEX !== "true"
                    ? [
                          plexOAuth({
                              clientId: env.PLEX_CLIENT_ID || "riven",
                              product: "Riven Media",
                              version: "1.0",
                              platform: "Web",
                              device: "Browser",
                              disableSignUp: env.ENABLE_PLEX_SIGNUP !== "true",
                              baseURL: env.ORIGIN || "http://localhost:5173"
                          })
                      ]
                    : []),
                ...getGenericOAuthProviders(env)
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

export function getAuthProviders() {
    const providers: Record<
        string,
        { enabled: boolean; disableSignup: boolean; name?: string; icon?: string }
    > = {};

    if (auth.options.emailAndPassword) {
        providers.credential = {
            enabled: auth.options.emailAndPassword.enabled,
            disableSignup: auth.options.emailAndPassword.disableSignUp
        };
    }

    if (env.DISABLE_PLEX !== "true") {
        providers.plex = {
            enabled: true,
            disableSignup: env.ENABLE_PLEX_SIGNUP !== "true",
            name: "Plex",
            icon: "https://api.iconify.design/mdi:plex.svg"
        };
    }

    const genericProviders = getGenericOAuthProviders(env);
    for (const provider of genericProviders) {
        providers[provider.providerId] = {
            enabled: true,
            disableSignup: !!provider.disableSignUp,
            name: provider.name || provider.providerId,
            icon: provider.icon
        };
    }
    return providers;
}
