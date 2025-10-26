import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";

export const GET: RequestHandler = async ({ fetch, locals, url, cookies }) => {
	if (!locals.user || !locals.session) {
		error(401, "Unauthorized");
	}

	// Extract all TVDB search parameters from URL
	const query = url.searchParams.get("query") || url.searchParams.get("q");
	const type = url.searchParams.get("type") || "series";
	const year = url.searchParams.get("year");
	const company = url.searchParams.get("company");
	const country = url.searchParams.get("country");
	const director = url.searchParams.get("director");
	const language = url.searchParams.get("language");
	const network = url.searchParams.get("network");
	const remote_id = url.searchParams.get("remote_id");
	const page = parseInt(url.searchParams.get("page") || "1");
	const limit = 20;
	const offset = (page - 1) * limit;

	if (!query && !remote_id) {
		error(400, "Search query or remote_id is required");
	}

	// Get TVDB token from cookie (set by hooks.server.ts)
	const tvdbToken = cookies.get("tvdb_cookie");

	if (!tvdbToken) {
		error(500, "TVDB authentication token not available");
	}

	try {
		// Build query parameters - only include defined values
		const searchParams: Record<string, string | number> = {
			type: type,
			limit: limit,
			offset: offset
		};

		if (query) searchParams.query = query;
		if (year) searchParams.year = parseInt(year);
		if (company) searchParams.company = company;
		if (country) searchParams.country = country;
		if (director) searchParams.director = director;
		if (language) searchParams.language = language;
		if (network) searchParams.network = network;
		if (remote_id) searchParams.remote_id = remote_id;

		// Make search request to TVDB using the provider client
		const searchResult = await providers.tvdb.GET("/search", {
			params: {
				query: searchParams,
				header: {
					Authorization: `Bearer ${tvdbToken}`
				}
			},
			fetch
		});

		if (searchResult.error) {
			console.error("TVDB search error:", searchResult.error);
			error(500, "Failed to search TVDB");
		}

		// Transform TVDB results to match our frontend format
		const transformedResults = (searchResult.data?.data || [])
			.filter((item) => item.type === "series") // Only include series
			.map((item) => ({
				id: item.tvdb_id,
				title: item.name || item.primary_name || "Unknown",
				poster_path: item.image_url || null,
				media_type: "TV",
				year: item.year || (item.first_air_time ? new Date(item.first_air_time).getFullYear() : "N/A"),
				vote_average: null, // TVDB doesn't provide ratings in search results
				vote_count: null,
				overview: item.overview || null,
				first_air_date: item.first_air_time || null
			}));

		// Calculate pagination info
		const totalItems = searchResult.data?.links?.total_items || transformedResults.length;
		const totalPages = Math.ceil(totalItems / limit);

		return json({
			results: transformedResults,
			page: page,
			total_pages: totalPages,
			total_results: totalItems
		});
	} catch (err) {
		console.error("Error searching TVDB:", err);
		error(500, err instanceof Error ? err.message : "Failed to search TVDB");
	}
};
