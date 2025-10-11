import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type { TMDBMovieDetailsExtended, TMDBParsedMovieDetails } from "$lib/providers/parser";
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
                    "external_ids,images,recommendations,similar,videos,credits,release_dates"
            }
        },
        fetch: fetch
    });

    if (detailsError) {
        error(500, detailsError);
    }

    const parsedDetails = providers.parser.parseTMDBMovieDetails(
        details as TMDBMovieDetailsExtended
    );

    return {
        details: parsedDetails as TMDBParsedMovieDetails
    };
}) satisfies PageServerLoad;
