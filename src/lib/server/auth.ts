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
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { ac, admin, user, manager } from "./permissions";
import { getGenericOAuthProviders } from "./oauth-utils";

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
            trustedProviders: ["plex", ...getGenericOAuthProviders(env).map((p) => p.providerId)]
        },
        encryptOAuthTokens: true
    },
    emailAndPassword: {
        enabled: env.DISABLE_EMAIL_PASSWORD !== "true",
        disableSignUp: env.ENABLE_EMAIL_PASSWORD_SIGNUP !== "true"
    },
    socialProviders: {
        plex: {
            clientId: "riven",
            product: "Riven Media",
            version: "1.0",
            platform: "Web",
            enabled: env.DISABLE_PLEX !== "true",
            disableSignUp: env.ENABLE_PLEX_SIGNUP !== "true"
        }
    },
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
            config: getGenericOAuthProviders(env)
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
    const providers = Object.entries(auth.options.socialProviders).reduce(
        (acc, [key, value]) => {
            acc[key] = {
                enabled: value.enabled,
                disableSignup: value.disableSignUp
            };
            return acc;
        },
        {} as Record<
            string,
            { enabled: boolean; disableSignup: boolean; name?: string; icon?: string }
        >
    );

    if (auth.options.emailAndPassword) {
        providers.credential = {
            enabled: auth.options.emailAndPassword.enabled,
            disableSignup: auth.options.emailAndPassword.disableSignUp
        };
    }

    // Add generic OAuth providers
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
