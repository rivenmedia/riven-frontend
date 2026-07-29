import type { PageServerLoad } from "./$types";
import {
    parsePersonDetails,
    parseCompanyDetails,
    parseTVDBPersonDetails
} from "$lib/metadata/parser";
import { error } from "@sveltejs/kit";
import {
    fetchTmdbDetails,
    fetchTvdbPersonExtended,
    mapGqlTmdbList,
    searchTmdb
} from "$lib/services/backend-metadata";

function isTmdbNotFoundError(err: unknown) {
    return (
        err instanceof Error &&
        err.message.includes("TMDB request failed") &&
        err.message.includes("status 404 Not Found")
    );
}

export const load: PageServerLoad = async ({ fetch, params, locals, url }) => {
    const { id, type } = params;
    const indexer = url.searchParams.get("indexer");

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid ID");
    }

    if (type === "person") {
        if (indexer === "tvdb") {
            try {
                const data = await fetchTvdbPersonExtended<Record<string, unknown>>(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    Number(id),
                    "translations"
                );

                return {
                    entity: parseTVDBPersonDetails(data)
                };
            } catch (err) {
                if (
                    err instanceof Error &&
                    err.message.includes("TVDB request failed") &&
                    err.message.includes("status 404 Not Found")
                ) {
                    error(404, "Person not found");
                }
                throw err;
            }
        }

        let data: Record<string, unknown>;
        try {
            data = await fetchTmdbDetails<Record<string, unknown>>(
                { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                {
                    type: "person",
                    id: Number(id),
                    appendToResponse: "combined_credits,external_ids"
                }
            );
        } catch (err) {
            if (isTmdbNotFoundError(err)) {
                error(404, "Person not found");
            }
            throw err;
        }

        return {
            entity: parsePersonDetails(data)
        };
    } else if (type === "company") {
        let companyRes: Record<string, unknown>;
        let moviesRes;
        let showsRes;
        try {
            [companyRes, moviesRes, showsRes] = await Promise.all([
                fetchTmdbDetails<Record<string, unknown>>(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    { type: "company", id: Number(id) }
                ),
                searchTmdb(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    {
                        type: "movie",
                        params: { with_companies: String(id), sort_by: "popularity.desc" },
                        searchMode: "discover"
                    }
                ),
                searchTmdb(
                    { backendUrl: locals.backendUrl, apiKey: locals.apiKey, fetch },
                    {
                        type: "tv",
                        params: { with_companies: String(id), sort_by: "popularity.desc" },
                        searchMode: "discover"
                    }
                )
            ]);
        } catch (err) {
            if (isTmdbNotFoundError(err)) {
                error(404, "Company not found");
            }
            throw err;
        }
        const movies = mapGqlTmdbList(moviesRes);
        const shows = mapGqlTmdbList(showsRes);

        return {
            entity: parseCompanyDetails(companyRes, movies, shows)
        };
    } else {
        error(404, "Invalid entity type");
    }
};
