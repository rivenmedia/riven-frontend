import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getAllSettings, setAllSettings } from "$lib/api";
import { zAppModel } from "$lib/api/zod.gen";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { message } from "sveltekit-superforms";

export const load: PageServerLoad = async () => {
    const settings = await getAllSettings({
        auth: process.env.BACKEND_API_KEY || ""
    });

    const adapter = zod4(zAppModel);

    if (settings.error) {
        error(500, "Failed to load settings");
    }

    const form = await superValidate(settings.data, adapter);

    return {
        form,
        schema: adapter.jsonSchema
    };
};

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await superValidate(request, zod4(zAppModel));
        console.log("Form Data:", form);

        if (!form.valid) {
            return fail(400, { form });
        }

        const result = await setAllSettings({
            body: form.data
        });

        if (result.error) {
            return fail(500, { form, error: result.error });
        }

        return message(form, "Settings updated successfully");
    }
};
