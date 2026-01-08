import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parsePersonDetails, parseCompanyDetails, transformTMDBList } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";

export const load: PageServerLoad = async ({ fetch, params }) => {
    const { id, type } = params;
    const customFetch = createCustomFetch(fetch);

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid ID");
    }

    if (type === "person") {
        const { data: personData, error: personError } = await providers.tmdb.GET(
            "/3/person/{person_id}",
            {
                params: {
                    path: { person_id: Number(id) },
                    query: { append_to_response: "combined_credits,external_ids" }
                },
                fetch: customFetch
            }
        );

        if (personError) {
            error(500, (personError as any).message || "Failed to fetch person details");
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

        if (companyRes.error) {
            error(500, (companyRes.error as any).message || "Failed to fetch company details");
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
