import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
    getSchemaForKeys,
    getSettingsForPaths,
    setSettingsForPaths
} from "$lib/utils/settings-api";
import { getSectionGroupById } from "$lib/components/settings/settings-sections";
import { buildSettingsUiSchema } from "$lib/components/settings/ui-schema";

/**
 * GET /settings/api?sectionId=...
 * Load schema and settings for a specific section.
 */
export const GET: RequestHandler = async ({ url, locals, fetch }) => {
    const sectionId = url.searchParams.get("sectionId");

    if (!sectionId) {
        return error(400, "sectionId is required");
    }

    const section = getSectionGroupById(sectionId);
    if (!section) {
        return error(400, "Invalid section");
    }

    const apiOptions = {
        baseUrl: locals.backendUrl,
        apiKey: locals.apiKey,
        fetch
    };

    try {
        const [schema, values] = await Promise.all([
            getSchemaForKeys(section.keys, section.title, apiOptions),
            getSettingsForPaths(section.keys, apiOptions)
        ]);

        const uiSchema = buildSettingsUiSchema(schema);

        return json({
            schema,
            uiSchema,
            values,
            sectionId
        });
    } catch (err) {
        console.error("Failed to load section:", err);
        return error(500, "Failed to load section data");
    }
};

/**
 * POST /settings/api
 * Save settings for a specific section.
 */
export const POST: RequestHandler = async ({ request, locals, fetch }) => {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return error(400, "Invalid JSON in request body");
    }

    // Validate body shape
    if (typeof body !== "object" || body === null) {
        return error(400, "Request body must be an object");
    }

    const { sectionId, values } = body as Record<string, unknown>;

    if (typeof sectionId !== "string" || !sectionId.trim()) {
        return error(400, "sectionId must be a non-empty string");
    }

    if (typeof values !== "object" || values === null) {
        return error(400, "values must be an object");
    }

    const section = getSectionGroupById(sectionId);
    if (!section) {
        return error(400, `Invalid section: ${sectionId}`);
    }

    const apiOptions = {
        baseUrl: locals.backendUrl,
        apiKey: locals.apiKey,
        fetch
    };

    try {
        await setSettingsForPaths(section.keys, values as Record<string, unknown>, apiOptions);
        return json({ success: true, sectionId });
    } catch (err) {
        console.error(`Failed to save section ${sectionId}:`, err);
        return error(500, `Failed to save settings for section: ${sectionId}`);
    }
};
