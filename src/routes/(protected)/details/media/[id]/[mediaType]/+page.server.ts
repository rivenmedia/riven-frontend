import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import type {
    TMDBMovieDetailsExtended,
    ParsedMovieDetails,
    ParsedShowDetails
} from "$lib/providers/parser";
import { error } from "@sveltejs/kit";

export type MediaDetails =
    | { type: "movie"; details: ParsedMovieDetails }
    | { type: "tv"; details: ParsedShowDetails };

export const load = (async ({ fetch, params, cookies }) => {
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

        // Get Trakt recommendations for movies
        let traktSlug = null;
        let traktRecs = null;

        // Get Trakt slug using TMDB ID
        const { data: traktSlugResp, error: traktSlugError } = await providers.trakt.GET(
            "/search/{id_type}/{id}",
            {
                params: {
                    path: {
                        id_type: "tmdb",
                        id: id
                    },
                    query: {
                        type: "movie"
                    }
                },
                fetch: fetch
            }
        );

        if (!traktSlugError && traktSlugResp && traktSlugResp.length > 0) {
            traktSlug = (traktSlugResp[0] as any).movie?.ids?.slug;
        }

        // Get Trakt recommendations
        if (traktSlug) {
            const { data: traktRecsData, error: traktRecsError } = await providers.trakt.GET(
                "/movies/{id}/related",
                {
                    params: {
                        path: {
                            id: traktSlug
                        },
                        query: {
                            extended: "images"
                        }
                    },
                    fetch: fetch
                }
            );
            
            if (!traktRecsError && traktRecsData) {
                traktRecs = traktRecsData;
            }
        }

        const parsedDetails = providers.parser.parseTMDBMovieDetails(
            details as TMDBMovieDetailsExtended,
            traktRecs
        );

        return {
            mediaDetails: {
                type: "movie",
                details: parsedDetails as ParsedMovieDetails
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
                        meta: "episodes,translations"
                    }
                },
                headers: {
                    Authorization: `Bearer ${cookies.get("tvdb_cookie") || ""}`
                },

                fetch: fetch
            }
        );

        if (detailsError) {
            error(500, detailsError);
        }

        let traktSlug = null;
        let traktRecs = null;

        // Get Trakt slug
        const { data: traktSlugResp, error: traktSlugError } = await providers.trakt.GET(
            "/search/{id_type}/{id}",
            {
                params: {
                    path: {
                        id_type: "tvdb",
                        id: id
                    },
                    query: {
                        type: "show"
                    }
                },
                fetch: fetch
            }
        );

        if (!traktSlugError && traktSlugResp && traktSlugResp.length > 0) {
            traktSlug = (traktSlugResp[0] as any).show?.ids?.slug;
        }

        // Get Trakt recommendations
        if (traktSlug) {
            const { data: traktRecsData, error: traktRecsError } = await providers.trakt.GET(
                "/shows/{id}/related",
                {
                    params: {
                        path: {
                            id: traktSlug
                        },
                        query: {
                            extended: "images"
                        }
                    },
                    fetch: fetch
                }
            );
            
            if (!traktRecsError && traktRecsData) {
                traktRecs = traktRecsData;
            }
        }

        // Pass traktRecs to the parser
        const parsedDetails = providers.parser.parseTVDBShowDetails(details.data, traktRecs);

        return {
            mediaDetails: {
                type: "tv",
                details: parsedDetails as ParsedShowDetails
            } as MediaDetails
        };
    } else {
        error(400, "Invalid media type");
    }
}) satisfies PageServerLoad;
