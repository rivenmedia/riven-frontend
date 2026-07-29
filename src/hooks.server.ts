import { auth } from "$lib/server/auth";
import { redirect, type Handle, type ServerInit } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { sequence } from "@sveltejs/kit/hooks";
import { env } from "$env/dynamic/private";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "$lib/server/db";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("hooks");

function getBackendApiKey() {
    return env.BACKEND_API_KEY || env.RIVEN_SETTING__API_KEY;
}

function getBackendAuthSigningSecret() {
    return env.BACKEND_AUTH_SIGNING_SECRET || env.RIVEN_SETTING__FRONTEND_AUTH_SIGNING_SECRET;
}

export const init: ServerInit = async () => {
    if (!env.BACKEND_URL) {
        throw new Error("BACKEND_URL environment variable is required");
    }
    if (!getBackendApiKey()) {
        throw new Error(
            "BACKEND_API_KEY or RIVEN_SETTING__API_KEY environment variable is required"
        );
    }
    if (!getBackendAuthSigningSecret()) {
        throw new Error(
            "BACKEND_AUTH_SIGNING_SECRET or RIVEN_SETTING__FRONTEND_AUTH_SIGNING_SECRET environment variable is required"
        );
    }
    migrate(db, { migrationsFolder: "drizzle" });

    // @ts-expect-error ignore
    logger.box(`Riven Frontend v${__APP_VERSION__}`);
};

export const betterAuthHandler: Handle = async ({ event, resolve }) => {
    if (event.route.id?.startsWith("/(protected)")) {
        const session = await auth.api.getSession({
            headers: event.request.headers
        });

        if (session) {
            event.locals.session = session?.session;
            event.locals.user = session?.user;
            return svelteKitHandler({ event, resolve, auth, building });
        } else {
            redirect(302, "/auth/login");
        }
    }

    return svelteKitHandler({ event, resolve, auth, building });
};

const configureLocals: Handle = async ({ event, resolve }) => {
    event.locals.backendUrl = env.BACKEND_URL!;
    event.locals.apiKey = getBackendApiKey()!;
    event.locals.backendAuthSigningSecret = getBackendAuthSigningSecret()!;

    return resolve(event);
};

export const handle: Handle = sequence(configureLocals, betterAuthHandler);
