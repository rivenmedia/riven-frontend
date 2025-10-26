import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { searchSchema } from "$lib/schemas/search";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
    // Parse and validate search params from the URL
    const form = await superValidate(url, zod4(searchSchema));

    return {
        form
    };
};