import type { RequestHandler } from "./$types";
import { error, json, redirect } from "@sveltejs/kit";
import { resolveExternalId } from "$lib/services/backend-metadata";

type Indexer = "tmdb" | "tvdb" | "imdb" | "anilist" | "riven";
type MediaType = "movie" | "tv";

interface ResolveAndRedirectOptions {
    from: Indexer;
    to: Indexer;
    id: string;
    mediaType: MediaType;
    backendUrl: string;
    apiKey: string;
    fetch: typeof fetch;
}

/**
 * Resolve ID and redirect to the details page, or return error response
 */
async function resolveAndRedirect(
    options: ResolveAndRedirectOptions,
    errorMessage: string
): Promise<Response> {
    const result = await resolveExternalId(
        { backendUrl: options.backendUrl, apiKey: options.apiKey, fetch: options.fetch },
        {
            from: options.from,
            to: options.to,
            id: options.id,
            mediaType: options.mediaType
        }
    );

    if (result.resolved) {
        const query = options.to === "tvdb" && options.mediaType === "tv" ? "?indexer=tvdb" : "";
        throw redirect(307, `/details/media/${result.id}/${options.mediaType}${query}`);
    }

    // For anilist, return JSON error; for others, throw HTTP error
    if (options.from === "anilist") {
        return json({
            error: errorMessage,
            indexer: options.from,
            type: options.mediaType,
            id: options.id
        });
    }
    throw error(404, errorMessage);
}

export const GET: RequestHandler = async ({ params, fetch, locals }) => {
    const { indexer, type, id } = params;

    const backendOpts = { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch };

    switch (indexer) {
        case "tmdb":
            if (!type) throw error(400, "Media type is required for tmdb");
            if (type === "movie") throw redirect(307, `/details/media/${id}/movie`);
            if (type === "tv") {
                return resolveAndRedirect(
                    {
                        from: "tmdb",
                        to: "tvdb",
                        id: id!,
                        mediaType: "tv",
                        ...backendOpts
                    },
                    "TVDB ID not found for this show"
                );
            }
            throw error(400, "Invalid media type for tmdb");

        case "tvdb":
            if (!type) throw error(400, "Media type is required for tvdb");
            if (type === "tv") throw redirect(307, `/details/media/${id}/tv?indexer=tvdb`);
            throw error(400, "Invalid media type for tvdb");

        case "anilist": {
            if (!type) throw error(400, "Media type is required for anilist");
            const isTV = ["TV", "TV_SHORT", "ONA"].includes(type);
            const isMovie = type === "MOVIE";

            if (isTV) {
                return resolveAndRedirect(
                    {
                        from: "anilist",
                        to: "tmdb",
                        id: id!,
                        mediaType: "tv",
                        ...backendOpts
                    },
                    "No TMDB ID found for this anime"
                );
            }
            if (isMovie) {
                return resolveAndRedirect(
                    {
                        from: "anilist",
                        to: "tmdb",
                        id: id!,
                        mediaType: "movie",
                        ...backendOpts
                    },
                    "No TMDB ID found for this anime movie"
                );
            }
            throw error(400, "Invalid media type for anilist");
        }

        case "riven":
            if (!type) throw error(400, "Media type is required for riven");
            if (type === "tv") {
                return resolveAndRedirect(
                    {
                        from: "riven",
                        to: "tvdb",
                        id: id!,
                        mediaType: "tv",
                        ...backendOpts
                    },
                    "TV item not found"
                );
            }
            if (type === "movie") {
                return resolveAndRedirect(
                    {
                        from: "riven",
                        to: "tmdb",
                        id: id!,
                        mediaType: "movie",
                        ...backendOpts
                    },
                    "Movie item not found"
                );
            }
            throw error(400, "Invalid media type for riven");
    }

    throw error(400, `Unsupported indexer: ${indexer}`);
};
