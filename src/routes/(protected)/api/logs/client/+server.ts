import { json, type RequestHandler } from "@sveltejs/kit";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("client-diag");

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { tag, message, data, userAgent } = body;

        logger.info(`[${tag || "CLIENT"}] ${message}`, {
            userId: locals.user?.id,
            userName: locals.user?.name,
            userAgent,
            ...data
        });

        return json({ ok: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        return json({ ok: false, error: "Failed to log" }, { status: 400 });
    }
};
