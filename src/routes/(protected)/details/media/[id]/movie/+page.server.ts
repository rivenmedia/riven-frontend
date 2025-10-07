import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { error } from "@sveltejs/kit";

// TODO: remove unnecessary appended responses

export const load = (async ({ fetch, params }) => {
    const { id } = params;

    const { data: details, error: detailsError } = await providers.tmdb.GET(`/3/movie/{movie_id}`, {
        params: {
            path: {
                movie_id: Number(id)
            },
            query: {
                append_to_response:
                    "external_ids,images,keywords,recommendations,similar,videos,credits,watch/providers"
            }
        },
        fetch: fetch
    });

    if (detailsError) {
        error(500, detailsError);
    }

    return {
        details
    };
}) satisfies PageServerLoad;
