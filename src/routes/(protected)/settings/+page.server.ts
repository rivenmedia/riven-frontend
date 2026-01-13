import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import providers from "$lib/providers";
import type { InitialFormData } from "@sjsf/sveltekit";
import { createFormHandler } from "@sjsf/sveltekit/server";
import * as defaults from "$lib/components/settings/form-defaults";

const getSchema = async (baseUrl: string, apiKey: string, fetch: typeof globalThis.fetch) => {
    const settingsSchema = await providers.riven.GET("/api/v1/settings/schema", {
        baseUrl,
        headers: {
            "x-api-key": apiKey
        },
        fetch
    });
    if (settingsSchema.error) {
        throw new Error("Failed to load settings schema");
    }

    return settingsSchema.data;
};

export const load: PageServerLoad = async ({ fetch, locals }) => {
    const allSettings = await providers.riven.GET("/api/v1/settings/get/all", {
        baseUrl: locals.backendUrl,
        headers: {
            "x-api-key": locals.apiKey
        },
        fetch: fetch
    });

    if (allSettings.error) {
        error(500, "Failed to load settings");
    }

    return {
        form: {
            schema: await getSchema(locals.backendUrl, locals.apiKey, fetch),
            initialValue: allSettings.data
        } satisfies InitialFormData
    };
};

export const actions = {
    default: async ({ request, fetch, locals }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleForm = createFormHandler<any, true>({
            ...defaults,
            // @ts-expect-error - it's valid
            schema: await getSchema(locals.backendUrl, locals.apiKey, fetch),
            sendData: true
        });

        const [form] = await handleForm(request.signal, await request.formData());
        if (!form.isValid) {
            return fail(400, { form });
        }

        // const res = await setAllSettings({
        //     fetch: fetch,
        //     body: form.data
        // });
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
