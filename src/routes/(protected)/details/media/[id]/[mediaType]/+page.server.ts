import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type { TMDBMovieDetailsExtended, TMDBParsedMovieDetails } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";

// Define a union type for the details
export type MediaDetails =
    | { type: "movie"; details: TMDBParsedMovieDetails }
    | { type: "tv"; details: any };

export const load = (async ({ fetch, params }) => {
    const { id, mediaType } = params;

    if (mediaType !== "movie" && mediaType !== "tv") {
        error(400, "Invalid media type");
    }

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid ID");
    }

    if (mediaType === "movie") {
        const { data: details, error: detailsError } = await providers.tmdb.GET(
            `/3/movie/{movie_id}`,
            {
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
            }
        );

        if (detailsError) {
            error(500, detailsError);
        }

        const parsedDetails = providers.parser.parseTMDBMovieDetails(
            details as TMDBMovieDetailsExtended
        );

        return {
            mediaDetails: {
                type: "movie",
                details: parsedDetails as TMDBParsedMovieDetails
            } as MediaDetails
        };
    } else if (mediaType === "tv") {
        const { data: details, error: detailsError } = await providers.tvdb.GET(
            `/series/{id}/extended`,
            {
                params: {
                    path: {
                        id: Number(id)
                    },
                    query: {
                        meta: "episodes"
                    }
                },

                fetch: fetch
            }
        );

        if (detailsError) {
            error(500, detailsError);
        }

        // const parsedDetails = providers.parser.parseTMDBTVDetails(details);

        // return {
        //     mediaDetails: {
        //         type: "tv",
        //         details: parsedDetails as TMDBParsedTVDetails
        //     } as MediaDetails
        // };

        return {};
    } else {
        error(400, "Invalid media type");
    }
}) satisfies PageServerLoad;
