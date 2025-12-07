import { auth } from "$lib/server/auth";
import { redirect, error, type Handle, type ServerInit } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { sequence } from "@sveltejs/kit/hooks";
import { env } from "$env/dynamic/private";
import { client } from "$lib/api/client.gen";
import providers from "$lib/providers";
import { dev } from "$app/environment";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "$lib/server/db";

export const init: ServerInit = async () => {
    if (!env.BACKEND_URL) {
        throw new Error("BACKEND_URL environment variable is required");
    }
    if (!env.BACKEND_API_KEY) {
        throw new Error("BACKEND_API_KEY environment variable is required");
    }
    migrate(db, { migrationsFolder: "drizzle" });
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
            redirect(307, "/auth/login");
        }
    } else {
        return svelteKitHandler({ event, resolve, auth, building });
    }
};

const configureClientMiddleware: Handle = async ({ event, resolve }) => {
    client.setConfig({
        baseUrl: env.BACKEND_URL,
        headers: {
            "x-api-key": env.BACKEND_API_KEY
        }
    });

    event.locals.backendUrl = env.BACKEND_URL;
    event.locals.apiKey = env.BACKEND_API_KEY;

    return resolve(event);
};

const handleTVDBCookie: Handle = async ({ event, resolve }) => {
    const tvdbCookie = event.cookies.get("tvdb_cookie");

    if (!tvdbCookie) {
        const tvdbLogin = await providers.tvdb.POST("/login", {
            body: {
                apikey: "6be85335-5c4f-4d8d-b945-d3ed0eb8cdce"
            },
            fetch: event.fetch
        });

        if (tvdbLogin.error) {
            error(500, "Failed to login to TVDB: " + tvdbLogin.error);
        } else {
            event.cookies.set("tvdb_cookie", tvdbLogin.data?.data?.token || "", {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: !dev,
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
            console.log("Set TVDB cookie");
        }
    }

    return resolve(event);
};

const errorInterceptor: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);

    client.interceptors.error.use((error: unknown) => {
        if (
            error &&
            typeof error === "object" &&
            "detail" in error &&
            typeof error.detail === "string"
        ) {
            if (error.detail === "Missing or invalid API key") {
                redirect(307, "/403");
            }
            return error.detail;
        }
        return undefined;
    });

    return response;
};

export const handle: Handle = sequence(
    configureClientMiddleware,
    errorInterceptor,
    betterAuthHandler,
    handleTVDBCookie
);
