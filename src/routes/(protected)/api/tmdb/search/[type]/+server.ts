import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import providers from "$lib/providers";

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

		// Convert URL search params to object
		for (const [key, value] of url.searchParams) {
			if (key === "searchMode") continue; // Skip our internal param

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
						query: queryParams
					},
					fetch
				});

				if (searchResult.error) {
					console.error("TMDB API error:", searchResult.error);
					error(500, "Failed to search movies");
				}

				const transformedResults = searchResult.data.results?.map((item) => ({
					id: item.id,
					title: item.title || item.original_title,
					poster_path: item.poster_path
						? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
						: null,
					media_type: "Movie",
					year: item.release_date ? new Date(item.release_date).getFullYear() : "N/A",
					vote_average: item.vote_average,
					vote_count: item.vote_count,
					genre_ids: item.genre_ids,
					release_date: item.release_date
				}));

				return json({
					results: transformedResults,
					page: searchResult.data.page,
					total_pages: searchResult.data.total_pages,
					total_results: searchResult.data.total_results
				});
			} else {
				const searchResult = await providers.tmdb.GET("/3/search/tv", {
					params: {
						query: queryParams
					},
					fetch
				});

				if (searchResult.error) {
					console.error("TMDB API error:", searchResult.error);
					error(500, "Failed to search TV shows");
				}

				const transformedResults = searchResult.data.results?.map((item) => ({
					id: item.id,
					title: item.name || item.original_name,
					poster_path: item.poster_path
						? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
						: null,
					media_type: "TV",
					year: item.first_air_date
						? new Date(item.first_air_date).getFullYear()
						: "N/A",
					vote_average: item.vote_average,
					vote_count: item.vote_count,
					genre_ids: item.genre_ids,
					first_air_date: item.first_air_date
				}));

				return json({
					results: transformedResults,
					page: searchResult.data.page,
					total_pages: searchResult.data.total_pages,
					total_results: searchResult.data.total_results
				});
			}
		} else {
			// Use discover endpoint
			if (type === "movie") {
				const discover = await providers.tmdb.GET("/3/discover/movie", {
					params: {
						query: queryParams
					},
					fetch
				});

				if (discover.error) {
					console.error("TMDB API error:", discover.error);
					error(500, "Failed to discover movies");
				}

				const transformedResults = discover.data.results?.map((item) => ({
					id: item.id,
					title: item.title || item.original_title,
					poster_path: item.poster_path
						? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
						: null,
					media_type: "Movie",
					year: item.release_date ? new Date(item.release_date).getFullYear() : "N/A",
					vote_average: item.vote_average,
					vote_count: item.vote_count,
					genre_ids: item.genre_ids,
					release_date: item.release_date
				}));

				return json({
					results: transformedResults,
					page: discover.data.page,
					total_pages: discover.data.total_pages,
					total_results: discover.data.total_results
				});
			} else {
				const discover = await providers.tmdb.GET("/3/discover/tv", {
					params: {
						query: queryParams
					},
					fetch
				});

				if (discover.error) {
					console.error("TMDB API error:", discover.error);
					error(500, "Failed to discover TV shows");
				}

				const transformedResults = discover.data.results?.map((item) => ({
					id: item.id,
					title: item.name || item.original_name,
					poster_path: item.poster_path
						? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
						: null,
					media_type: "TV",
					year: item.first_air_date
						? new Date(item.first_air_date).getFullYear()
						: "N/A",
					vote_average: item.vote_average,
					vote_count: item.vote_count,
					genre_ids: item.genre_ids,
					first_air_date: item.first_air_date
				}));

				return json({
					results: transformedResults,
					page: discover.data.page,
					total_pages: discover.data.total_pages,
					total_results: discover.data.total_results
				});
			}
		}
	} catch (err) {
		console.error("Error searching/discovering media:", err);
		error(500, "Failed to search/discover media");
	}
};
