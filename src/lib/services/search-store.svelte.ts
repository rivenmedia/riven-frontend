import { browser } from "$app/environment";
import type { ParsedSearchQuery } from "$lib/search-parser";
import { buildTMDBQueryString, buildTVDBQueryString } from "$lib/utils/query-builder";

export class SearchStore {
	#searchQuery = $state<string>("");
	#rawSearchString = $state<string>("");
	#parsedSearch = $state<ParsedSearchQuery | null>(null);
	#movieResults = $state<any[]>([]);
	#tvResults = $state<any[]>([]);
	#loading = $state<boolean>(false);
	#error = $state<string | null>(null);
	#moviePage = $state<number>(1);
	#tvPage = $state<number>(1);
	#totalResults = $state<number>(0);
	#movieHasMore = $state<boolean>(true);
	#tvHasMore = $state<boolean>(true);
	#mediaType = $state<"movie" | "tv" | "both">("both");
	#warnings = $state<string[]>([]);

	get searchQuery() {
		return this.#searchQuery;
	}

	get rawSearchString() {
		return this.#rawSearchString;
	}

	get parsedSearch() {
		return this.#parsedSearch;
	}

	get warnings() {
		return this.#warnings;
	}

	get results() {
		if (this.#mediaType === "both") {
			return [...this.#movieResults, ...this.#tvResults];
		}
		return this.#mediaType === "movie" ? this.#movieResults : this.#tvResults;
	}

	get movieResults() {
		return this.#movieResults;
	}

	get tvResults() {
		return this.#tvResults;
	}

	get loading() {
		return this.#loading;
	}

	get error() {
		return this.#error;
	}

	get totalResults() {
		// If we're using client-side filters, return the actual filtered count
		if (this.#parsedSearch && Object.keys(this.#parsedSearch.clientFilters).length > 0) {
			if (this.#mediaType === "both") {
				return this.#movieResults.length + this.#tvResults.length;
			}
			return this.#mediaType === "movie" ? this.#movieResults.length : this.#tvResults.length;
		}
		// Otherwise return the API's total
		return this.#totalResults;
	}

	get hasMore() {
		if (this.#mediaType === "both") {
			return this.#movieHasMore || this.#tvHasMore;
		}
		return this.#mediaType === "movie" ? this.#movieHasMore : this.#tvHasMore;
	}

	get mediaType() {
		return this.#mediaType;
	}

	setMediaType(type: "movie" | "tv" | "both") {
		if (this.#mediaType === type) return;
		this.#mediaType = type;
		// Don't reset pages or results - just filter what we show
	}

	setSearch(rawString: string, parsed: ParsedSearchQuery) {
		this.#rawSearchString = rawString;
		this.#searchQuery = parsed.query;
		this.#parsedSearch = parsed;
		this.#warnings = parsed.warnings;
		this.#moviePage = 1;
		this.#tvPage = 1;
		this.#movieHasMore = true;
		this.#tvHasMore = true;
		this.#movieResults = [];
		this.#tvResults = [];
	}

	async search(): Promise<void> {
		if (!browser) return;

		try {
			this.#loading = true;
			this.#error = null;
			this.#movieResults = [];
			this.#tvResults = [];
			this.#totalResults = 0; // Reset total results
			this.#moviePage = 1;
			this.#tvPage = 1;

			if (this.#mediaType === "both" || this.#mediaType === "movie") {
				await this.fetchMovies(1);
			}

			if (this.#mediaType === "both" || this.#mediaType === "tv") {
				await this.fetchTV(1);
			}
		} catch (error) {
			console.error("Error searching:", error);
			this.#error = error instanceof Error ? error.message : String(error);
		} finally {
			this.#loading = false;
		}
	}


	private applyClientFilters(items: any[]): any[] {
		if (!this.#parsedSearch || Object.keys(this.#parsedSearch.clientFilters).length === 0) {
			return items;
		}

		return items.filter((item) => {
			const filters = this.#parsedSearch!.clientFilters;

			// Genre filtering
			if (filters.with_genres) {
				const requiredGenres = String(filters.with_genres)
					.split(/[,|]/)
					.map((g) => Number(g.trim()));
				const separator = String(filters.with_genres).includes("|") ? "OR" : "AND";

				if (separator === "AND") {
					// All genres must be present
					if (
						!requiredGenres.every((genreId) => item.genre_ids?.includes(genreId))
					) {
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
				if (
					!item.vote_average ||
					item.vote_average < Number(filters["vote_average.gte"])
				) {
					return false;
				}
			}

			if (filters["vote_average.lte"] !== undefined) {
				if (
					!item.vote_average ||
					item.vote_average > Number(filters["vote_average.lte"])
				) {
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
					const minDate =
						filters["release_date.gte"] || filters["primary_release_date.gte"];
					if (dateField < String(minDate)) {
						return false;
					}
				}

				if (filters["release_date.lte"] || filters["primary_release_date.lte"]) {
					const maxDate =
						filters["release_date.lte"] || filters["primary_release_date.lte"];
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

	private async fetchMovies(page: number): Promise<void> {
		if (!this.#parsedSearch) return;

		const queryString = buildTMDBQueryString(this.#parsedSearch, page);
		const response = await fetch(`/api/tmdb/search/movie?${queryString}`);

		if (!response.ok) {
			throw new Error("Failed to fetch movie results");
		}

		const result = await response.json();
		const filteredResults = this.applyClientFilters(result.results || []);

		if (page === 1) {
			this.#movieResults = filteredResults;
			// For page 1, set or add based on media type
			if (this.#mediaType === "movie") {
				this.#totalResults = result.total_results || 0;
			} else {
				this.#totalResults += result.total_results || 0;
			}
			console.log("type is {} and total results are now {}", this.#mediaType, this.#totalResults)
		} else {
			this.#movieResults = [...this.#movieResults, ...filteredResults];
		}

		this.#movieHasMore = result.page < result.total_pages;
	}

	private async fetchTV(page: number): Promise<void> {
		if (!this.#parsedSearch) return;

		// Use TVDB for TV shows - build query string with the utility
		const queryString = buildTVDBQueryString(this.#parsedSearch, page);
		const response = await fetch(`/api/tvdb/search?${queryString}`);

		if (!response.ok) {
			throw new Error("Failed to fetch TV results from TVDB");
		}

		const result = await response.json();
		const filteredResults = this.applyClientFilters(result.results || []);

		if (page === 1) {
			this.#tvResults = filteredResults;
			// For page 1, set or add based on media type
			if (this.#mediaType === "tv") {
				this.#totalResults = result.total_results || 0;
			} else {
				this.#totalResults += result.total_results || 0;
			}
			console.log("type is {} and total results are now {}", this.#mediaType, this.#totalResults)
		} else {
			this.#tvResults = [...this.#tvResults, ...filteredResults];
		}

		this.#tvHasMore = result.page < result.total_pages;
	}

	async loadMore(): Promise<void> {
		if (!browser || this.#loading || !this.hasMore || !this.#parsedSearch) return;

		try {
			this.#loading = true;
			this.#error = null;

			if ((this.#mediaType === "both" || this.#mediaType === "movie") && this.#movieHasMore) {
				this.#moviePage += 1;
				const queryString = buildTMDBQueryString(this.#parsedSearch, this.#moviePage);
				const response = await fetch(`/api/tmdb/search/movie?${queryString}`);

				if (!response.ok) {
					this.#moviePage -= 1;
					throw new Error("Failed to fetch more movie results");
				}

				const result = await response.json();
				const newItems = this.applyClientFilters(result.results || []);

				if (newItems.length > 0) {
					this.#movieResults = [...this.#movieResults, ...newItems];
				}

				this.#movieHasMore = result.page < result.total_pages;
			}

			if ((this.#mediaType === "both" || this.#mediaType === "tv") && this.#tvHasMore) {
				this.#tvPage += 1;
				const queryString = buildTVDBQueryString(this.#parsedSearch, this.#tvPage);
				const response = await fetch(`/api/tvdb/search?${queryString}`);

				if (!response.ok) {
					this.#tvPage -= 1;
					throw new Error("Failed to fetch more TV results from TVDB");
				}

				const result = await response.json();
				const newItems = this.applyClientFilters(result.results || []);

				if (newItems.length > 0) {
					this.#tvResults = [...this.#tvResults, ...newItems];
				}

				this.#tvHasMore = result.page < result.total_pages;
			}
		} catch (error) {
			console.error("Error loading more results:", error);
			this.#error = error instanceof Error ? error.message : String(error);
		} finally {
			this.#loading = false;
		}
	}

	clear() {
		this.#searchQuery = "";
		this.#rawSearchString = "";
		this.#parsedSearch = null;
		this.#movieResults = [];
		this.#tvResults = [];
		this.#moviePage = 1;
		this.#tvPage = 1;
		this.#movieHasMore = true;
		this.#tvHasMore = true;
		this.#totalResults = 0;
		this.#error = null;
		this.#warnings = [];
	}
}
