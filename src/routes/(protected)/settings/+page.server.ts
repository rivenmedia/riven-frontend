import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { getSettingsSchema, getAllSettings } from "$lib/api";
import type { InitialFormData } from "@sjsf/sveltekit";

export const load: PageServerLoad = async () => {
    const settingsSchema = await getSettingsSchema();

    if (settingsSchema.error) {
        error(500, "Failed to load settings schema");
    }

    const allSettings = await getAllSettings();

    if (allSettings.error) {
        error(500, "Failed to load settings");
    }
    
    return {
        form: {
            schema: settingsSchema.data,
            initialValue: allSettings.data
        } satisfies InitialFormData
    };
};