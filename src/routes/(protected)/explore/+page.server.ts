import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { searchSchema } from "$lib/schemas/search";
import type { PageServerLoad } from "./$types";
import { parseSearchQuery } from "$lib/search-parser";

export const load: PageServerLoad = async ({ url }) => {
    // Parse and validate search params from the URL
    const form = await superValidate(url.searchParams, zod4(searchSchema));
    const parsed = parseSearchQuery(form.data.query || "");

    return {
        form,
        parsed
    };
};