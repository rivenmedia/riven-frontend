/**
 * Genre definitions for movies and TV shows
 */
export const MOVIE_GENRES = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" }
] as const;

export const TV_GENRES = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" }
] as const;

export const CONTENT_RATINGS = ["NR", "G", "PG", "PG-13", "R", "NC-17"] as const;
export type ContentRating = (typeof CONTENT_RATINGS)[number];

export const LANGUAGE_OPTIONS = [
    { value: "", label: "All Languages" },
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "zh", label: "Chinese" },
    { value: "hi", label: "Hindi" },
    { value: "ru", label: "Russian" }
] as const;

export const SORT_OPTIONS = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "popularity.asc", label: "Least Popular" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "vote_average.asc", label: "Lowest Rated" },
    { value: "primary_release_date.desc", label: "Newest" },
    { value: "primary_release_date.asc", label: "Oldest" },
    { value: "revenue.desc", label: "Highest Revenue" }
] as const;

// Slider configuration defaults
export const RUNTIME_CONFIG = { min: 0, max: 400, step: 10 } as const;
export const VOTE_AVERAGE_CONFIG = { min: 0, max: 10, step: 0.5 } as const;
export const VOTE_COUNT_CONFIG = { min: 0, max: 1000, step: 50 } as const;

/**
 * Filter store using Svelte 5 runes
 */
export class FilterStore {
    // Date filters
    releaseDateFrom = $state("");
    releaseDateTo = $state("");

    // Genre filter
    withGenres = $state<number[]>([]);

    // Language filter
    withOriginalLanguage = $state("");

    // Content rating (movies only)
    certifications = $state<ContentRating[]>([]);

    // Runtime (minutes)
    runtimeMin = $state(RUNTIME_CONFIG.min);
    runtimeMax = $state(RUNTIME_CONFIG.max);

    // Vote average (0-10)
    voteAverageMin = $state(VOTE_AVERAGE_CONFIG.min);
    voteAverageMax = $state(VOTE_AVERAGE_CONFIG.max);

    // Vote count
    voteCountMin = $state(VOTE_COUNT_CONFIG.min);
    voteCountMax = $state(VOTE_COUNT_CONFIG.max);

    // Sort
    sortBy = $state("popularity.desc");

    // UI state
    isOpen = $state(false);

    get hasActiveFilters(): boolean {
        return (
            this.releaseDateFrom !== "" ||
            this.releaseDateTo !== "" ||
            this.withGenres.length > 0 ||
            this.withOriginalLanguage !== "" ||
            this.certifications.length > 0 ||
            this.runtimeMin !== RUNTIME_CONFIG.min ||
            this.runtimeMax !== RUNTIME_CONFIG.max ||
            this.voteAverageMin !== VOTE_AVERAGE_CONFIG.min ||
            this.voteAverageMax !== VOTE_AVERAGE_CONFIG.max ||
            this.voteCountMin !== VOTE_COUNT_CONFIG.min ||
            this.voteCountMax !== VOTE_COUNT_CONFIG.max ||
            this.sortBy !== "popularity.desc"
        );
    }

    get activeFilterCount(): number {
        let count = 0;
        if (this.releaseDateFrom || this.releaseDateTo) count++;
        if (this.withGenres.length > 0) count++;
        if (this.withOriginalLanguage) count++;
        if (this.certifications.length > 0) count++;
        if (this.runtimeMin !== RUNTIME_CONFIG.min || this.runtimeMax !== RUNTIME_CONFIG.max)
            count++;
        if (
            this.voteAverageMin !== VOTE_AVERAGE_CONFIG.min ||
            this.voteAverageMax !== VOTE_AVERAGE_CONFIG.max
        )
            count++;
        if (
            this.voteCountMin !== VOTE_COUNT_CONFIG.min ||
            this.voteCountMax !== VOTE_COUNT_CONFIG.max
        )
            count++;
        if (this.sortBy !== "popularity.desc") count++;
        return count;
    }

    /**
     * Build TMDB API parameters - includes both movie and TV date params
     * so the server can use the appropriate ones per media type
     */
    buildParams(): Record<string, string | number> {
        const params: Record<string, string | number> = {};

        // Date filters - include both variants, server will use appropriate one
        if (this.releaseDateFrom) {
            params["primary_release_date.gte"] = this.releaseDateFrom;
            params["first_air_date.gte"] = this.releaseDateFrom;
        }
        if (this.releaseDateTo) {
            params["primary_release_date.lte"] = this.releaseDateTo;
            params["first_air_date.lte"] = this.releaseDateTo;
        }

        // Genres
        if (this.withGenres.length > 0) {
            params.with_genres = this.withGenres.join(",");
        }

        // Language
        if (this.withOriginalLanguage) {
            params.with_original_language = this.withOriginalLanguage;
        }

        // Certifications (movies only - TV will ignore)
        if (this.certifications.length > 0) {
            params.certification_country = "US";
            params.certification = this.certifications.join("|");
        }

        // Runtime
        if (this.runtimeMin > RUNTIME_CONFIG.min) params["with_runtime.gte"] = this.runtimeMin;
        if (this.runtimeMax < RUNTIME_CONFIG.max) params["with_runtime.lte"] = this.runtimeMax;

        // Vote average
        if (this.voteAverageMin > VOTE_AVERAGE_CONFIG.min)
            params["vote_average.gte"] = this.voteAverageMin;
        if (this.voteAverageMax < VOTE_AVERAGE_CONFIG.max)
            params["vote_average.lte"] = this.voteAverageMax;

        // Vote count
        if (this.voteCountMin > VOTE_COUNT_CONFIG.min) params["vote_count.gte"] = this.voteCountMin;
        if (this.voteCountMax < VOTE_COUNT_CONFIG.max) params["vote_count.lte"] = this.voteCountMax;

        // Sort
        if (this.sortBy !== "popularity.desc") params.sort_by = this.sortBy;

        return params;
    }

    toggleGenre(genreId: number): void {
        const idx = this.withGenres.indexOf(genreId);
        if (idx === -1) {
            this.withGenres = [...this.withGenres, genreId];
        } else {
            this.withGenres = this.withGenres.filter((id) => id !== genreId);
        }
    }

    toggleCertification(cert: ContentRating): void {
        const idx = this.certifications.indexOf(cert);
        if (idx === -1) {
            this.certifications = [...this.certifications, cert];
        } else {
            this.certifications = this.certifications.filter((c) => c !== cert);
        }
    }

    reset(): void {
        this.releaseDateFrom = "";
        this.releaseDateTo = "";
        this.withGenres = [];
        this.withOriginalLanguage = "";
        this.certifications = [];
        this.runtimeMin = RUNTIME_CONFIG.min;
        this.runtimeMax = RUNTIME_CONFIG.max;
        this.voteAverageMin = VOTE_AVERAGE_CONFIG.min;
        this.voteAverageMax = VOTE_AVERAGE_CONFIG.max;
        this.voteCountMin = VOTE_COUNT_CONFIG.min;
        this.voteCountMax = VOTE_COUNT_CONFIG.max;
        this.sortBy = "popularity.desc";
    }

    open(): void {
        this.isOpen = true;
    }

    close(): void {
        this.isOpen = false;
    }
}
