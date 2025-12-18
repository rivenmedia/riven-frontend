import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { createCustomFetch } from "$lib/custom-fetch";

interface RatingScore {
    name: string;
    image?: string;
    score: number | string | null;
}

export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const { tmdbId } = params;
    const mediaType = url.searchParams.get("type") as "movie" | "tv" | null;
    const customFetch = createCustomFetch(fetch);

    if (!mediaType || !["movie", "tv"].includes(mediaType)) {
        throw error(400, 'Invalid or missing media type. Must be "movie" or "tv"');
    }

    const scores: RatingScore[] = [];

    try {
        // 1. TMDB Rating
        try {
            if (mediaType === "movie") {
                const movieData = await providers.tmdb.GET("/3/movie/{movie_id}", {
                    params: {
                        path: {
                            movie_id: Number(tmdbId)
                        }
                    },
                    fetch: customFetch
                });

                if (movieData.data?.vote_average) {
                    scores.push({
                        name: "tmdb",
                        image: "tmdb.png",
                        score: Math.round(movieData.data.vote_average * 10) / 10
                    });
                }
            } else {
                const tvData = await providers.tmdb.GET("/3/tv/{series_id}", {
                    params: {
                        path: {
                            series_id: Number(tmdbId)
                        }
                    },
                    fetch: customFetch
                });

                if (tvData.data?.vote_average) {
                    scores.push({
                        name: "tmdb",
                        image: "tmdb.png",
                        score: Math.round(tvData.data.vote_average * 10) / 10
                    });
                }
            }
        } catch (e) {
            console.error("TMDB rating fetch failed:", e);
        }

        // 2. Get IMDB ID for other providers
        let imdbId: string | null = null;
        try {
            if (mediaType === "movie") {
                const externalIds = await providers.tmdb.GET("/3/movie/{movie_id}/external_ids", {
                    params: {
                        path: {
                            movie_id: Number(tmdbId)
                        }
                    },
                    fetch: customFetch
                });
                imdbId = externalIds.data?.imdb_id || null;
            } else {
                const externalIds = await providers.tmdb.GET("/3/tv/{series_id}/external_ids", {
                    params: {
                        path: {
                            series_id: Number(tmdbId)
                        }
                    },
                    fetch: customFetch
                });
                imdbId = externalIds.data?.imdb_id || null;
            }
        } catch (e) {
            console.error("Failed to fetch IMDB ID:", e);
        }

        if (imdbId) {
            try {
                const url = "https://api.imdbapi.dev/titles/" + imdbId;
                const imdbResponse = await customFetch(url);
                if (imdbResponse.ok) {
                    const imdbData = await imdbResponse.json();
                    const imdbRating = imdbData?.rating?.aggregateRating;

                    if (imdbRating) {
                        scores.push({
                            name: "imdb",
                            image: "imdb.png",
                            score: imdbRating
                        });
                    }
                }
            } catch (e) {
                console.error("IMDB rating fetch failed:", e);
            }

            // 4. Trakt Rating
            try {
                if (mediaType === "movie") {
                    const traktData = await providers.trakt.GET("/movies/{id}/ratings", {
                        params: {
                            path: {
                                id: imdbId
                            }
                        },
                        fetch: customFetch
                    });

                    if (traktData.data?.rating) {
                        scores.push({
                            name: "trakt",
                            image: "trakt.png",
                            score: Math.round(traktData.data.rating * 10) / 10
                        });
                    }
                } else {
                    const traktData = await providers.trakt.GET("/shows/{id}/ratings", {
                        params: {
                            path: {
                                id: imdbId
                            }
                        },
                        fetch: customFetch
                    });

                    if (traktData.data?.rating) {
                        scores.push({
                            name: "trakt",
                            image: "trakt.png",
                            score: Math.round(traktData.data.rating * 10) / 10
                        });
                    }
                }
            } catch (e) {
                console.error("Trakt rating fetch failed:", e);
            }
        }

        // Filter out null scores
        const validScores = scores.filter(
            (score) =>
                score.score !== null &&
                score.score !== "" &&
                score.score !== 0 &&
                score.score !== "0.0"
        );

        return json({
            scores: validScores,
            tmdbId: Number(tmdbId),
            mediaType,
            imdbId
        });
    } catch (e) {
        console.error("Rating fetch error:", e);
        throw error(500, "Failed to fetch ratings");
    }
};
