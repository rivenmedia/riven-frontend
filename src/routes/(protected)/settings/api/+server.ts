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
    const body = await request.json();
    const { sectionId, values } = body;

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
        await setSettingsForPaths(section.keys, values, apiOptions);
        return json({ success: true, sectionId });
    } catch (err) {
        console.error("Failed to save section:", err);
        return error(500, "Failed to save settings");
    }
};
