import type { RequestHandler } from "./$types";
import { error, redirect, json } from "@sveltejs/kit";
import { resolveId, type Indexer, type MediaType } from "$lib/services/resolver";
import { createCustomFetch } from "$lib/custom-fetch";

interface ResolveAndRedirectOptions {
    from: Indexer;
    to: Indexer;
    id: string;
    mediaType: MediaType;
    customFetch: typeof fetch;
    rivenBaseUrl?: string;
    rivenApiKey?: string;
}

/**
 * Resolve ID and redirect to the details page, or return error response
 */
async function resolveAndRedirect(
    options: ResolveAndRedirectOptions,
    errorMessage: string
): Promise<Response> {
    const result = await resolveId({
        ...options,
        id: options.from === "tmdb" ? Number(options.id) : options.id
    });

    if (result.resolved) {
        throw redirect(307, `/details/media/${result.id}/${options.mediaType}`);
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
    const customFetch = createCustomFetch(fetch);

    const rivenOpts = { rivenBaseUrl: locals.backendUrl, rivenApiKey: locals.apiKey };

    switch (indexer) {
        case "tmdb":
            if (!type) throw error(400, "Media type is required for tmdb");
            if (type === "movie") throw redirect(307, `/details/media/${id}/movie`);
            if (type === "tv") {
                return resolveAndRedirect(
                    { from: "tmdb", to: "tvdb", id: id!, mediaType: "tv", customFetch },
                    "TVDB ID not found for this show"
                );
            }
            throw error(400, "Invalid media type for tmdb");

        case "tvdb":
            if (!type) throw error(400, "Media type is required for tvdb");
            if (type === "tv") throw redirect(307, `/details/media/${id}/tv`);
            throw error(400, "Invalid media type for tvdb");

        case "anilist": {
            if (!type) throw error(400, "Media type is required for anilist");
            const isTV = ["TV", "TV_SHORT", "ONA"].includes(type);
            const isMovie = type === "MOVIE";

            if (isTV) {
                return resolveAndRedirect(
                    { from: "anilist", to: "tvdb", id: id!, mediaType: "tv", customFetch },
                    "No TVDB ID found for this anime"
                );
            }
            if (isMovie) {
                return resolveAndRedirect(
                    { from: "anilist", to: "tmdb", id: id!, mediaType: "movie", customFetch },
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
                        customFetch,
                        ...rivenOpts
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
                        customFetch,
                        ...rivenOpts
                    },
                    "Movie item not found"
                );
            }
            throw error(400, "Invalid media type for riven");
    }

    return json({ indexer, type, id });
};
