import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parsePersonDetails, parseCompanyDetails, transformTMDBList } from "$lib/providers/parser";
import { error, redirect } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";
import { resolveId } from "$lib/services/resolver";

export const load: PageServerLoad = async ({ fetch, params, cookies }) => {
    const { id, type } = params;
    const customFetch = createCustomFetch(fetch);

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid ID");
    }

    if (type === "person") {
        let personId = Number(id);
        const tvdbToken = cookies.get("tvdb_cookie") || "";
        let { data: personData, error: personError } = await providers.tmdb.GET(
            "/3/person/{person_id}",
            {
                params: {
                    path: { person_id: personId },
                    query: { append_to_response: "combined_credits,external_ids" }
                },
                fetch: customFetch
            }
        );

        // If TMDB returns 404, it might be a TVDB ID
        if (personError && (personError as any).status === 404) {
            const resolved = await resolveId({
                from: "tvdb",
                to: "tmdb",
                id: personId,
                mediaType: "person",
                tvdbToken,
                customFetch
            });

            if (resolved.resolved) {
                // Redirect to the correct TMDB ID to update the URL
                throw redirect(308, `/details/entity/${resolved.id}/person`);
            }
        }

        if (personError) {
            error(
                500,
                (personError as { message?: string; status_message?: string }).message ||
                (personError as { message?: string; status_message?: string }).status_message ||
                "Failed to fetch person details"
            );
        }

        return {
            entity: parsePersonDetails(personData)
        };
    } else if (type === "company") {
        const [companyRes, moviesRes, showsRes] = await Promise.all([
            providers.tmdb.GET("/3/company/{company_id}", {
                params: { path: { company_id: Number(id) } },
                fetch: customFetch
            }),
            providers.tmdb.GET("/3/discover/movie", {
                params: {
                    query: {
                        with_companies: String(id),
                        sort_by: "popularity.desc"
                    }
                },
                fetch: customFetch
            }),
            providers.tmdb.GET("/3/discover/tv", {
                params: {
                    query: {
                        with_companies: String(id),
                        sort_by: "popularity.desc"
                    }
                },
                fetch: customFetch
            })
        ]);

        const companyResUnknown = companyRes as { error?: { message?: string } };
        if (companyResUnknown.error) {
            error(500, companyResUnknown.error.message || "Failed to fetch company details");
        }

        const movies = transformTMDBList(moviesRes.data?.results ?? [], "movie");
        const shows = transformTMDBList(showsRes.data?.results ?? [], "tv");

        return {
            entity: parseCompanyDetails(companyRes.data, movies, shows)
        };
    } else {
        error(404, "Invalid entity type");
    }
};
