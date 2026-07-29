import { error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { buildBackendRoleHeaders } from "./rbac";

export const proxyGraphql: RequestHandler = async ({ locals, request }) => {
    const body = await request.text();

    try {
        const headers = new Headers({
            "Content-Type": request.headers.get("content-type") ?? "application/json",
            "x-api-key": locals.apiKey
        });
        for (const [key, value] of Object.entries(
            buildBackendRoleHeaders(locals.user, locals.backendAuthSigningSecret)
        )) {
            headers.set(key, value);
        }
        const accept = request.headers.get("accept");

        if (accept) {
            headers.set("accept", accept);
        }

        const response = await fetch(`${locals.backendUrl}/graphql`, {
            method: "POST",
            headers,
            body
        });

        const responseHeaders = new Headers();
        const contentType = response.headers.get("content-type");
        const cacheControl = response.headers.get("cache-control");

        if (contentType) {
            responseHeaders.set("content-type", contentType);
        }

        if (cacheControl) {
            responseHeaders.set("cache-control", cacheControl);
        }

        return new Response(response.body, {
            status: response.status,
            headers: responseHeaders
        });
    } catch {
        throw error(500, "Failed to reach GraphQL backend");
    }
};
