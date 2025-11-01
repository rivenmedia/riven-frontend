import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parsePersonDetails } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";

export const load = (async ({ fetch, params }) => {
    const { id } = params;

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
            fetch: fetch
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
