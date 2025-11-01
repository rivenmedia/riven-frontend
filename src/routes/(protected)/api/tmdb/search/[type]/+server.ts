import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import providers from "$lib/providers";
import { transformTMDBList } from "$lib/providers/parser";

/**
 * Apply server-side filters to TMDB results
 */
function applyServerFilters(items: any[], filters: Record<string, any>): any[] {
	if (!filters || Object.keys(filters).length === 0) {
		return items;
	}

	return items.filter((item) => {
		// Genre filtering
		if (filters.with_genres) {
			const requiredGenres = String(filters.with_genres)
				.split(/[,|]/)
				.map((g) => Number(g.trim()));
			const separator = String(filters.with_genres).includes("|") ? "OR" : "AND";

			if (separator === "AND") {
				// All genres must be present
				if (!requiredGenres.every((genreId) => item.genre_ids?.includes(genreId))) {
					return false;
				}
			} else {
				// At least one genre must be present
				if (!requiredGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
					return false;
				}
			}
		}

		if (filters.without_genres) {
			const excludedGenres = String(filters.without_genres)
				.split(/[,|]/)
				.map((g) => Number(g.trim()));

			// None of the excluded genres should be present
			if (excludedGenres.some((genreId) => item.genre_ids?.includes(genreId))) {
				return false;
			}
		}

		// Vote average filtering
		if (filters["vote_average.gte"] !== undefined) {
			if (!item.vote_average || item.vote_average < Number(filters["vote_average.gte"])) {
				return false;
			}
		}

		if (filters["vote_average.lte"] !== undefined) {
			if (!item.vote_average || item.vote_average > Number(filters["vote_average.lte"])) {
				return false;
			}
		}

		// Vote count filtering
		if (filters["vote_count.gte"] !== undefined) {
			if (!item.vote_count || item.vote_count < Number(filters["vote_count.gte"])) {
				return false;
			}
		}

		if (filters["vote_count.lte"] !== undefined) {
			if (!item.vote_count || item.vote_count > Number(filters["vote_count.lte"])) {
				return false;
			}
		}

		// Date filtering
		const dateField = item.release_date || item.first_air_date;
		if (dateField) {
			if (filters["release_date.gte"] || filters["primary_release_date.gte"]) {
				const minDate = filters["release_date.gte"] || filters["primary_release_date.gte"];
				if (dateField < String(minDate)) {
					return false;
				}
			}

			if (filters["release_date.lte"] || filters["primary_release_date.lte"]) {
				const maxDate = filters["release_date.lte"] || filters["primary_release_date.lte"];
				if (dateField > String(maxDate)) {
					return false;
				}
			}

			if (filters["air_date.gte"] || filters["first_air_date.gte"]) {
				const minDate = filters["air_date.gte"] || filters["first_air_date.gte"];
				if (dateField < String(minDate)) {
					return false;
				}
			}

			if (filters["air_date.lte"] || filters["first_air_date.lte"]) {
				const maxDate = filters["air_date.lte"] || filters["first_air_date.lte"];
				if (dateField > String(maxDate)) {
					return false;
				}
			}
		}

		return true;
	});
}

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
	if (!locals.user || !locals.session) {
		error(401, "Unauthorized");
	}

	const { type } = params;

	if (type !== "movie" && type !== "tv") {
		error(400, "Invalid media type. Must be 'movie' or 'tv'");
	}

	const searchMode = url.searchParams.get("searchMode") || "discover";
	console.log(`Searching ${type}s with mode: ${searchMode}`);

	try {
		// Get all query parameters from the URL
		const queryParams: Record<string, any> = {};
		const clientFilters: Record<string, any> = {};

		// Parameters that should be applied as client-side (server-side) filters
		const CLIENT_FILTERABLE = new Set([
			'with_genres',
			'without_genres',
			'vote_average.gte',
			'vote_average.lte',
			'vote_count.gte',
			'vote_count.lte'
		]);

		// Convert URL search params to object
		for (const [key, value] of url.searchParams) {
			if (key === "searchMode") continue; // Skip our internal param

			// Check if this should be a client-side filter
			if (CLIENT_FILTERABLE.has(key)) {
				// Handle numeric parameters
				if (key.includes("vote_")) {
					const numValue = Number(value);
					if (!isNaN(numValue)) {
						clientFilters[key] = numValue;
					}
				} else {
					clientFilters[key] = value;
				}
				continue; // Don't add to queryParams
			}

			// Handle numeric parameters
			if (
				key.includes("year") ||
				key.includes("vote_") ||
				key.includes("runtime") ||
				key === "page" ||
				key === "with_networks" ||
				key === "with_release_type"
			) {
				const numValue = Number(value);
				if (!isNaN(numValue)) {
					queryParams[key] = numValue;
				}
			}
			// Handle boolean parameters
			else if (
				key === "include_adult" ||
				key === "include_video" ||
				key === "include_null_first_air_dates" ||
				key === "screened_theatrically"
			) {
				queryParams[key] = value === "true" || value === "1";
			}
			// Handle string parameters
			else {
				queryParams[key] = value;
			}
		}

		// Route to appropriate endpoint based on searchMode
		if (searchMode === "search" || searchMode === "hybrid") {
			console.log("Search with the following params", queryParams)
			// Use search endpoint
			if (type === "movie") {
				const searchResult = await providers.tmdb.GET("/3/search/movie", {
					params: {
						query: queryParams as any
					},
					fetch
				});

				if (searchResult.error) {
					console.error("TMDB API error:", searchResult.error);
					error(500, "Failed to search movies");
				}

				const transformedResults = transformTMDBList(searchResult.data?.results || null);
				const filteredResults = applyServerFilters(transformedResults || [], clientFilters);

				return json({
					results: filteredResults,
					page: searchResult.data?.page || 1,
					total_pages: searchResult.data?.total_pages || 1,
					total_results: searchResult.data?.total_results || 0
				});
			} else {
				const searchResult = await providers.tmdb.GET("/3/search/tv", {
					params: {
						query: queryParams as any
					},
					fetch
				});

				if (searchResult.error) {
					console.error("TMDB API error:", searchResult.error);
					error(500, "Failed to search TV shows");
				}

				const transformedResults = transformTMDBList(searchResult.data?.results || null);
				const filteredResults = applyServerFilters(transformedResults || [], clientFilters);

				return json({
					results: filteredResults,
					page: searchResult.data?.page || 1,
					total_pages: searchResult.data?.total_pages || 1,
					total_results: searchResult.data?.total_results || 0
				});
			}
		} else {
			// Use discover endpoint
			if (type === "movie") {
				const discover = await providers.tmdb.GET("/3/discover/movie", {
					params: {
						query: queryParams as any
					},
					fetch
				});

				if (discover.error) {
					console.error("TMDB API error:", discover.error);
					error(500, "Failed to discover movies");
				}

				const transformedResults = transformTMDBList(discover.data?.results || null);
				const filteredResults = applyServerFilters(transformedResults || [], clientFilters);

				return json({
					results: filteredResults,
					page: discover.data?.page || 1,
					total_pages: discover.data?.total_pages || 1,
					total_results: discover.data?.total_results || 0
				});
			} else {
				const discover = await providers.tmdb.GET("/3/discover/tv", {
					params: {
						query: queryParams as any
					},
					fetch
				});

				if (discover.error) {
					console.error("TMDB API error:", discover.error);
					error(500, "Failed to discover TV shows");
				}

				const transformedResults = transformTMDBList(discover.data?.results || null);
				const filteredResults = applyServerFilters(transformedResults || [], clientFilters);

				return json({
					results: filteredResults,
					page: discover.data?.page || 1,
					total_pages: discover.data?.total_pages || 1,
					total_results: discover.data?.total_results || 0
				});
			}
		}
	} catch (err) {
		console.error("Error searching/discovering media:", err);
		error(500, "Failed to search/discover media");
	}
};
