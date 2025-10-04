import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getAllSettings, setSettings } from "$lib/api";
import { zAppModel } from "$lib/api/zod.gen";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { message } from "sveltekit-superforms";

export const load: PageServerLoad = async () => {
    const settings = await getAllSettings({
        auth: process.env.API_KEY || ""
    });
    if (settings.error) {
        error(500, "Failed to load settings");
    }

    const form = await superValidate(settings.data, zod(zAppModel));

    return {
        form
    };
};

export const actions: Actions = {
    default: async ({ request }) => {
        const form = await superValidate(request, zod(zAppModel));
        console.log("Form Data:", form);

        if (!form.valid) {
            return fail(400, { form });
        }

        // const result = await setSettings();

        // if (result.error) {
        //   return fail(500, { form, error: result.error });
        // }

        return message(form, "Settings updated successfully");
    }
};
