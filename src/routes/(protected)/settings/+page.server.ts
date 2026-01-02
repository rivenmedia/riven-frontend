import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import providers from "$lib/providers";
import type { InitialFormData } from "@sjsf/sveltekit";
import type { Schema, UiSchemaRoot } from "@sjsf/form";
import { createFormHandler } from "@sjsf/sveltekit/server";
import * as defaults from "$lib/components/settings/form-defaults";
import type { AppSettings } from "$lib/components/settings/form-defaults";
import { buildSettingsUiSchema } from "$lib/components/settings/form-defaults";

async function getSchema(
    baseUrl: string,
    apiKey: string,
    fetch: typeof globalThis.fetch
): Promise<Schema> {
    const response = await providers.riven.GET("/api/v1/settings/schema", {
        baseUrl,
        headers: { "x-api-key": apiKey },
        fetch
    });

    if (response.error || !response.data) {
        throw new Error("Failed to load settings schema");
    }

    return response.data as Schema;
}

interface SettingsFormData extends InitialFormData {
    uiSchema: UiSchemaRoot;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
    // Fetch settings JSON schema and settings
    const [schema, allSettings] = await Promise.all([
        getSchema(locals.backendUrl, locals.apiKey, fetch),
        providers.riven.GET("/api/v1/settings/get/all", {
            baseUrl: locals.backendUrl,
            headers: { "x-api-key": locals.apiKey },
            fetch
        })
    ]);

    if (allSettings.error) {
        error(500, "Failed to load settings");
    }

    const uiSchema = buildSettingsUiSchema(schema);

    return {
        form: {
            schema,
            uiSchema,
            initialValue: allSettings.data
        } satisfies SettingsFormData
    };
};

export const actions = {
    default: async ({ request, fetch, locals }) => {
        const schema = await getSchema(locals.backendUrl, locals.apiKey, fetch);
        if (!schema) {
            return fail(500, { error: "Failed to load settings schema" });
        }
        const handleForm = createFormHandler<AppSettings, true>({
            ...defaults,
            schema,
            uiSchema: buildSettingsUiSchema(schema),
            sendData: true
        });

        const [form] = await handleForm(request.signal, await request.formData());
        if (!form.isValid) {
            return fail(400, { form });
        }

        const res = await providers.riven.POST("/api/v1/settings/set/all", {
            body: form.data,
            baseUrl: locals.backendUrl,
            headers: {
                "x-api-key": locals.apiKey
            },
            fetch: fetch
        });

        if (res.error) {
            return fail(500, { form });
        }

        return { form };
    }
} satisfies Actions;
