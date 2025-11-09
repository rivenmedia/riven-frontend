import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { getSettingsSchema, getAllSettings, setAllSettings } from "$lib/api";
import type { InitialFormData } from "@sjsf/sveltekit";
import { createFormHandler } from "@sjsf/sveltekit/server";
import * as defaults from "$lib/components/settings/form-defaults";

const getSchema = async () => {
    const settingsSchema = await getSettingsSchema();
    if (settingsSchema.error) {
        throw new Error("Failed to load settings schema");
    }

    return settingsSchema.data;
};
export const load: PageServerLoad = async ({ fetch }) => {
    const allSettings = await getAllSettings({
        fetch: fetch
    });

    if (allSettings.error) {
        error(500, "Failed to load settings");
    }

    return {
        form: {
            schema: await getSchema(),
            initialValue: allSettings.data
        } satisfies InitialFormData
    };
};

export const actions = {
    default: async ({ request, fetch }) => {
        const handleForm = createFormHandler<any, true>({
            ...defaults,
            // @ts-expect-error - it's valid
            schema: await getSchema(),
            sendData: true
        });

        const [form, , invalid] = await handleForm(request.signal, await request.formData());
        if (!form.isValid) {
            return fail(400, { form });
        }

        const res = await setAllSettings({
            fetch: fetch,
            body: form.data
        });

        if (res.error) {
            return fail(500, { form });
        }

        return { form };
    }
} satisfies Actions;
