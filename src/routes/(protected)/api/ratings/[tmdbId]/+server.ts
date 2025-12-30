import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { createCustomFetch } from "$lib/custom-fetch";
import { ratingsCache } from "$lib/services/api-cache";
import { createScopedLogger } from "$lib/logger";

const logger = createScopedLogger("ratings");

interface RatingScore {
    name: string;
    image: string;
    score: number | string;
    url: string;
}

interface RatingsResponse {
    scores: RatingScore[];
    tmdbId: number;
    mediaType: "movie" | "tv";
    imdbId: string | null;
    cached?: boolean;
}

// Radarr's public IMDB proxy response
interface RadarrImdbResponse {
    ImdbId: string;
    Title: string;
    MovieRatings: {
        Imdb?: { Value: number; Count: number };
    };
}

// Rotten Tomatoes Algolia response
interface RTAlgoliaResponse {
    results: Array<{
        hits: RTHit[];
        index: string;
    }>;
}

interface RTHit {
    title: string;
    vanity: string;
    releaseYear: number;
    type: string;
    rottenTomatoes?: {
        criticsScore: number;
        audienceScore: number;
        certifiedFresh: boolean;
    };
}

function getCacheKey(tmdbId: string, mediaType: string): string {
    return `ratings:${mediaType}:${tmdbId}`;
}

// Simple title similarity check
function normalizeTitle(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
}

function findBestRTMatch(hits: RTHit[], title: string, year?: number): RTHit | null {
    const normalizedTitle = normalizeTitle(title);

    const scored = hits
        .filter((h) => h.rottenTomatoes)
        .map((h) => {
            const titleMatch = normalizeTitle(h.title) === normalizedTitle ? 1 : 0.5;
            const yearMatch = year && h.releaseYear === year ? 1 : year ? 0.7 : 1;
            return { hit: h, score: titleMatch * yearMatch };
        })
        .filter(({ score }) => score > 0.3)
        .sort((a, b) => b.score - a.score);

    return scored[0]?.hit || null;
}

export const GET: RequestHandler = async ({ params, url, fetch, setHeaders }) => {
    const { tmdbId } = params;
    const mediaType = url.searchParams.get("type") as "movie" | "tv" | null;
    const customFetch = createCustomFetch(fetch);

    if (!mediaType || !["movie", "tv"].includes(mediaType)) {
        throw error(400, 'Invalid or missing media type. Must be "movie" or "tv"');
    }

    // Check cache first
    const cacheKey = getCacheKey(tmdbId, mediaType);
    const cached = ratingsCache.get(cacheKey) as RatingsResponse | null;
    if (cached) {
        setHeaders({ "Cache-Control": "public, max-age=3600", "X-Cache": "HIT" });
        return json({ ...cached, cached: true });
    }

    const scores: RatingScore[] = [];
    let imdbId: string | null = null;
    let title: string | null = null;
    let year: number | undefined;

    // SINGLE TMDB call with append_to_response
    try {
        const tmdbData =
            mediaType === "movie"
                ? await providers.tmdb.GET("/3/movie/{movie_id}", {
                      params: {
                          path: { movie_id: Number(tmdbId) },
                          query: { append_to_response: "external_ids" }
                      },
                      fetch: customFetch
                  })
                : await providers.tmdb.GET("/3/tv/{series_id}", {
                      params: {
                          path: { series_id: Number(tmdbId) },
                          query: { append_to_response: "external_ids" }
                      },
                      fetch: customFetch
                  });

        if (tmdbData.data) {
            const vote_average = tmdbData.data.vote_average;
            const vote_count = tmdbData.data.vote_count;

            // Get title and year for RT search
            if (mediaType === "movie") {
                title = (tmdbData.data as { title?: string }).title || null;
                const releaseDate = (tmdbData.data as { release_date?: string }).release_date;
                year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) : undefined;
            } else {
                title = (tmdbData.data as { name?: string }).name || null;
                const firstAirDate = (tmdbData.data as { first_air_date?: string }).first_air_date;
                year = firstAirDate ? parseInt(firstAirDate.substring(0, 4), 10) : undefined;
            }

            // Add TMDB rating - only require vote_average to exist and be > 0
            if (vote_average && vote_average > 0) {
                scores.push({
                    name: "tmdb",
                    image: "tmdb.svg",
                    score: `${Math.round(vote_average * 10)}%`, // Convert to percentage
                    url: `https://www.themoviedb.org/${mediaType}/${tmdbId}`
                });
            }

            // @ts-expect-error - external_ids is appended dynamically
            imdbId = tmdbData.data.external_ids?.imdb_id || null;
        }
    } catch (e) {
        logger.error("[ratings] TMDB fetch failed:", e);
    }

    // Fetch IMDB rating via Radarr's public proxy
    if (imdbId && mediaType === "movie") {
        try {
            const radarrResponse = await customFetch(
                `https://api.radarr.video/v1/movie/imdb/${imdbId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    }
                }
            );

            if (radarrResponse.ok) {
                const data: RadarrImdbResponse[] = await radarrResponse.json();
                const movie = data.find((m) => m.ImdbId === imdbId);

                if (movie?.MovieRatings?.Imdb?.Value) {
                    scores.push({
                        name: "imdb",
                        image: "imdb.svg",
                        score: movie.MovieRatings.Imdb.Value,
                        url: `https://www.imdb.com/title/${imdbId}/`
                    });
                }
            }
        } catch (e) {
            logger.error("[ratings] Radarr IMDB proxy failed:", e);
        }
    }

    // Fetch Rotten Tomatoes via Algolia
    if (title) {
        try {
            const filters = encodeURIComponent(
                `isEmsSearchable=1 AND type:"${mediaType === "movie" ? "movie" : "tv"}"`
            );

            const rtResponse = await customFetch(
                "https://79frdp12pn-dsn.algolia.net/1/indexes/*/queries",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "x-algolia-agent": "Algolia for JavaScript (4.14.3); Browser (lite)",
                        "x-algolia-api-key": "175588f6e5f8319b27702e4cc4013561",
                        "x-algolia-application-id": "79FRDP12PN"
                    },
                    body: JSON.stringify({
                        requests: [
                            {
                                indexName: "content_rt",
                                query: title.replace(/\bthe\b ?/gi, ""),
                                params: `filters=${filters}&hitsPerPage=20`
                            }
                        ]
                    })
                }
            );

            if (rtResponse.ok) {
                const data: RTAlgoliaResponse = await rtResponse.json();
                const contentResults = data.results.find((r) => r.index === "content_rt");
                const match = findBestRTMatch(contentResults?.hits || [], title, year);

                if (match?.rottenTomatoes) {
                    const rt = match.rottenTomatoes;

                    // Critics score (Tomatometer)
                    if (rt.criticsScore > 0) {
                        const isFresh = rt.criticsScore >= 60;
                        scores.push({
                            name: "rt-critics",
                            image: isFresh ? "rt_fresh.svg" : "rt_rotten.svg",
                            score: `${rt.criticsScore}%`,
                            url: `https://www.rottentomatoes.com/${mediaType === "movie" ? "m" : "tv"}/${match.vanity}`
                        });
                    }

                    // Audience score (Popcorn)
                    if (rt.audienceScore > 0) {
                        const isUpright = rt.audienceScore >= 60;
                        scores.push({
                            name: "rt-audience",
                            image: isUpright ? "rt_aud_fresh.svg" : "rt_aud_rotten.svg",
                            score: `${rt.audienceScore}%`,
                            url: `https://www.rottentomatoes.com/${mediaType === "movie" ? "m" : "tv"}/${match.vanity}`
                        });
                    }
                }
            }
        } catch (e) {
            logger.error("[ratings] Rotten Tomatoes fetch failed:", e);
        }
    }

    const response: RatingsResponse = {
        scores,
        tmdbId: Number(tmdbId),
        mediaType,
        imdbId
    };

    // Cache response
    ratingsCache.set(cacheKey, response);
    setHeaders({ "Cache-Control": "public, max-age=3600", "X-Cache": "MISS" });

    return json(response);
};
