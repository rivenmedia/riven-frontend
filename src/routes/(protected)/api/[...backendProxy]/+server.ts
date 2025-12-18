import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

const proxyRequest = async (method: string, locals: App.Locals, url: URL, request?: Request) => {
    const backendUrl = new URL(url.pathname, locals.backendUrl);

    try {
        const response = await fetch(`${backendUrl}${url.search}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": locals.apiKey
            },
            body:
                request && ["POST", "PUT", "PATCH", "DELETE"].includes(method)
                    ? await request.text()
                    : undefined
        });
        return json(await response.json(), { status: response.status });
    } catch {
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
