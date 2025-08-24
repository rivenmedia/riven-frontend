import { auth } from "$lib/server/auth";
import { redirect, error, type Handle, type ServerInit } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { getUsersCount } from "$lib/server/functions";
import { sequence } from "@sveltejs/kit/hooks";
import { BACKEND_URL, BACKEND_API_KEY } from "$env/static/private";
import { client } from "$lib/api/client.gen";
import providers from "$lib/providers";
import { dev } from "$app/environment";

export const init: ServerInit = async () => {
    const userCount = (await getUsersCount())[0].count;

    if (userCount === 0) {
        console.warn("No users found in the database. Creating an admin user...");

        const data = await auth.api.createUser({
            body: {
                name: "Admin",
                email: "admin@admin.com",
                password: "admin",
                role: ["admin"],
                data: {
                    username: "admin",
                    image: "/images/admin.webp"
                }
            }
        });

        console.log("Admin user created:", data);
    }
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
    event.locals.backendUrl = BACKEND_URL;
    event.locals.apiKey = BACKEND_API_KEY;
    client.setConfig({
        baseUrl: BACKEND_URL,
        headers: {
            "x-api-key": BACKEND_API_KEY
        }
    });

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
