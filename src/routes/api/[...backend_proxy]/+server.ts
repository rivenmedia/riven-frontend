import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, url }) => {
    const { pathname } = url;
    const backendPathname = pathname.replace("/api", "");
    const backendUrl = new URL(backendPathname, locals.BACKEND_URL);

    try {
        const response = await fetch(`${backendUrl.toString()}${url.search}`);
        return json(await response.json());
    } catch {
        throw error(500, "Failed to fetch data from backend");
    }
};

export const PUT: RequestHandler = async ({ locals, url, request }) => {
    const { pathname } = url;
    const backendPathname = pathname.replace("/api", "");
    const backendUrl = new URL(backendPathname, locals.BACKEND_URL);

    try {
        const response = await fetch(`${backendUrl.toString()}${url.search}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: await request.text()
        });
        return json(await response.json());
    } catch {
        throw error(500, "Failed to fetch data from backend");
    }
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
    const { pathname } = url;
    const backendPathname = pathname.replace("/api", "");
    const backendUrl = new URL(backendPathname, locals.BACKEND_URL);

    try {
        const response = await fetch(`${backendUrl.toString()}${url.search}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: await request.text()
        });
        return json(await response.json());
    } catch {
        throw error(500, "Failed to fetch data from backend");
    }
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
    const { pathname } = url;
    const backendPathname = pathname.replace("/api", "");
    const backendUrl = new URL(backendPathname, locals.BACKEND_URL);

    try {
        const response = await fetch(`${backendUrl.toString()}${url.search}`, {
            method: 'DELETE'
        });
        return json(await response.json());
    } catch {
        throw error(500, "Failed to fetch data from backend");
    }
}