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


async function getTraktData(fetch: typeof globalThis.fetch, mediaId: string, isMovie: boolean) {
    const idType = isMovie ? "tmdb" : "tvdb";
    const mediaType = isMovie ? "movie" : "show";
    const endpointPrefix = isMovie ? "movies" : "shows";
    
    let traktSlug = null;
    let traktRecs = null;

    const { data: traktSlugResp, error: traktSlugError } = await providers.trakt.GET(
        "/search/{id_type}/{id}",
        {
            params: {
                path: {
                    id_type: idType,
                    id: mediaId
                },
                query: {
                    type: mediaType
                }
            },
            fetch: fetch
        }
    );

    if (!traktSlugError && traktSlugResp && traktSlugResp.length > 0) {
        traktSlug = (traktSlugResp[0] as any)[mediaType]?.ids?.slug;
    }

    if (traktSlug) {
        const { data: traktRecsData, error: traktRecsError } = await providers.trakt.GET(
            `/${endpointPrefix}/{id}/related`,
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

    return { traktSlug, traktRecs };
}

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

        const { traktRecs } = await getTraktData(fetch, id, true);

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

        const { traktRecs } = await getTraktData(fetch, id, false);

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
