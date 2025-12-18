import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parsePersonDetails } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";

export const load = (async ({ fetch, params }) => {
    const { id } = params;
    const customFetch = createCustomFetch(fetch);

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid person ID");
    }

    const { data: personData, error: personError } = await providers.tmdb.GET(
        "/3/person/{person_id}",
        {
            params: {
                path: {
                    person_id: Number(id)
                },
                query: {
                    append_to_response: "combined_credits,external_ids"
                }
            },
            fetch: customFetch
        }
    );

    if (personError) {
        error(500, personError);
    }

    const person = parsePersonDetails(personData);

    return {
        person
    };
}) satisfies PageServerLoad;
