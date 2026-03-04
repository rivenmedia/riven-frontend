// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

const proxyRequest = async (method: string, locals: App.Locals, url: URL, request?: Request) => {
    // Tighten scope: only proxy to /api/ subpaths of the backend
    const proxyPath = url.pathname.replace(/^\/api\//, "/api/");
    const targetUrl = new URL(proxyPath, locals.backendUrl);
    targetUrl.search = url.search;

    try {
        const response = await fetch(targetUrl.toString(), {
            method,
            headers: {
                "x-api-key": locals.apiKey,
                // Forward the content-type from the original request if it exists
                "Content-Type": request?.headers.get("Content-Type") || "application/json"
            },
            body:
                request && ["POST", "PUT", "PATCH", "DELETE"].includes(method)
                    ? await request.text()
                    : undefined
        });

        const contentType = response.headers.get("Content-Type") || "";
        const body = await response.text();

        return new Response(body, {
            status: response.status,
            headers: {
                "Content-Type": contentType
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(`[proxy] Error fetching ${targetUrl}:`, e);
        throw error(500, "Failed to fetch data from backend");
    }
};

export const GET: RequestHandler = ({ locals, url }) => proxyRequest("GET", locals, url);
export const POST: RequestHandler = ({ locals, url, request }) =>
    proxyRequest("POST", locals, url, request);
export const PUT: RequestHandler = ({ locals, url, request }) =>
    proxyRequest("PUT", locals, url, request);
export const DELETE: RequestHandler = ({ locals, url, request }) =>
    proxyRequest("DELETE", locals, url, request);
