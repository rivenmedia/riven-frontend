import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import providers from "$lib/providers";
import { createCustomFetch } from "$lib/custom-fetch";
import { createScopedLogger } from "$lib/logger";
import * as dateUtils from "$lib/utils/date";

const logger = createScopedLogger("ratings");

// RT Algolia API credentials (public, used by RT's own website)
const RT_ALGOLIA_API_KEY = "175588f6e5f8319b27702e4cc4013561";
const RT_ALGOLIA_APP_ID = "79FRDP12PN";
const RT_ALGOLIA_URL = "https://79frdp12pn-dsn.algolia.net/1/indexes/*/queries";

// RT matching tunables (matching Jellyseerr)
const INEXACT_TITLE_FACTOR = 0.25;
const ALTERNATE_TITLE_FACTOR = 0.8;
const PER_YEAR_PENALTY = 0.4;
const MINIMUM_SCORE = 0.175;

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
}

interface RadarrImdbResponse {
    ImdbId: string;
    MovieRatings: {
        Imdb?: { Value: number };
    };
}

interface RTAlgoliaSearchResponse {
    results: {
        hits: RTAlgoliaHit[];
        index: "content_rt" | "people_rt";
    }[];
}

interface RTAlgoliaHit {
    title: string;
    titles?: string[];
    releaseYear: number;
    vanity: string;
    aka?: string[];
    rottenTomatoes?: {
        audienceScore: number;
        certifiedFresh: boolean;
        criticsScore: number;
    };
}

/**
 * Jaro similarity algorithm for fuzzy string matching
 * Returns a value between 0 (no match) and 1 (exact match)
 */
function jaroSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, s2.length);

        for (let j = start; j < end; j++) {
            if (s2Matches[j] || s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    // Count transpositions
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    return (
        (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3
    );
}

/**
 * Normalize title for comparison - lowercase and strip non-alphanumeric (unicode-aware)
 */
function normalizeTitle(s: string): string {
    return s
        .toLowerCase()
        .replace(/[^\p{L}\p{N} ]/gu, "")
        .trim();
}

/**
 * Calculate title similarity with inexact matching penalty
 */
function titleSimilarity(a: string, b: string): number {
    return a === b ? 1 : jaroSimilarity(a, b) * INEXACT_TITLE_FACTOR;
}

/**
 * Get best similarity score between searched title and all alternate titles
 */
function getTitleScore(hit: RTAlgoliaHit, searchTitle: string): number {
    const normalizedSearch = normalizeTitle(searchTitle);

    const scoreTitleVariant = (title: string, isAlternate: boolean): number => {
        const score = titleSimilarity(normalizeTitle(title), normalizedSearch);
        return isAlternate ? score * ALTERNATE_TITLE_FACTOR : score;
    };

    const allTitles = [hit.title, ...(hit.aka || []), ...(hit.titles || [])];
    const scores = allTitles.map((t, i) => scoreTitleVariant(t, i > 0));

    return Math.max(...scores);
}

/**
 * Calculate year match score with penalty for year difference
 */
function getYearScore(hit: RTAlgoliaHit, year?: number): number {
    if (!year) return 1;
    return Math.max(0, 1 - Math.abs(hit.releaseYear - year) * PER_YEAR_PENALTY);
}

/**
 * Penalize results without ratings data
 */
function getExtraScore(hit: RTAlgoliaHit): number {
    return hit.rottenTomatoes ? 1 : 0.5;
}

/**
 * Combined scoring function
 */
function calculateScore(hit: RTAlgoliaHit, title: string, year?: number): number {
    return getTitleScore(hit, title) * getYearScore(hit, year) * getExtraScore(hit);
}

/**
 * Find the best matching RT result based on combined scoring
 */
function findBestRTMatch(hits: RTAlgoliaHit[], title: string, year?: number): RTAlgoliaHit | null {
    const scored = hits
        .map((hit) => ({ hit, score: calculateScore(hit, title, year) }))
        .filter(({ score }) => score > MINIMUM_SCORE)
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

    // Collect scores in separate variables to ensure consistent ordering
    let tmdbScore: RatingScore | null = null;
    let imdbScore: RatingScore | null = null;
    let rtCriticsScore: RatingScore | null = null;
    let rtAudienceScore: RatingScore | null = null;

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
            const data = tmdbData.data as Record<string, unknown>;

            // Get title and year for RT search
            if (mediaType === "movie") {
                title = (data.title as string) || null;
                year = dateUtils.getYearFromISO(data.release_date as string) ?? undefined;
            } else {
                title = (data.name as string) || null;
                year = dateUtils.getYearFromISO(data.first_air_date as string) ?? undefined;
            }

            // Add TMDB rating
            const voteAverage = data.vote_average as number | undefined;
            if (voteAverage && voteAverage > 0) {
                tmdbScore = {
                    name: "tmdb",
                    image: "tmdb.svg",
                    score: `${Math.round(voteAverage * 10)}%`,
                    url: `https://www.themoviedb.org/${mediaType}/${tmdbId}`
                };
            }

            // Get IMDB ID from external_ids (appended via append_to_response)
            const externalIds = data.external_ids as { imdb_id?: string } | undefined;
            imdbId = externalIds?.imdb_id || null;
        }
    } catch (e) {
        logger.error("[ratings] TMDB fetch failed:", e);
    }

    // Parallelize external fetches
    const fetchPromises: Promise<void>[] = [];

    // Fetch IMDB rating via Radarr's public proxy
    if (imdbId && mediaType === "movie") {
        fetchPromises.push(
            (async () => {
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
                            imdbScore = {
                                name: "imdb",
                                image: "imdb.svg",
                                score: movie.MovieRatings.Imdb.Value,
                                url: `https://www.imdb.com/title/${imdbId}/`
                            };
                        }
                    }
                } catch (e) {
                    logger.error("[ratings] Radarr IMDB proxy failed:", e);
                }
            })()
        );
    }

    // Fetch Rotten Tomatoes via Algolia
    if (title) {
        fetchPromises.push(
            (async () => {
                try {
                    const contentType = mediaType === "movie" ? "movie" : "tv";
                    const filters = encodeURIComponent(
                        `isEmsSearchable=1 AND type:"${contentType}"`
                    );
                    // Strip "the" from movie titles to improve search results (Jellyseerr approach)
                    const searchQuery =
                        mediaType === "movie" ? title!.replace(/\bthe\b ?/gi, "") : title!;

                    const rtResponse = await customFetch(RT_ALGOLIA_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            "x-algolia-agent": "Algolia for JavaScript (4.14.3); Browser (lite)",
                            "x-algolia-api-key": RT_ALGOLIA_API_KEY,
                            "x-algolia-application-id": RT_ALGOLIA_APP_ID
                        },
                        body: JSON.stringify({
                            requests: [
                                {
                                    indexName: "content_rt",
                                    query: searchQuery,
                                    params: `filters=${filters}&hitsPerPage=20`
                                }
                            ]
                        })
                    });

                    if (rtResponse.ok) {
                        const data: RTAlgoliaSearchResponse = await rtResponse.json();
                        const contentResults = data.results.find((r) => r.index === "content_rt");
                        const match = findBestRTMatch(contentResults?.hits || [], title!, year);

                        if (match?.rottenTomatoes) {
                            const rt = match.rottenTomatoes;
                            const rtUrl = `https://www.rottentomatoes.com/${mediaType === "movie" ? "m" : "tv"}/${match.vanity}`;

                            // Critics score (Tomatometer)
                            // Movies: Certified Fresh (75%+ with enough reviews), Fresh (60%+), Rotten (<60%)
                            // TV: Fresh (60%+), Rotten (<60%) - no Certified Fresh
                            if (rt.criticsScore > 0) {
                                let criticsName: string;
                                let criticsImage: string;

                                if (mediaType === "movie" && rt.certifiedFresh) {
                                    criticsName = "rt_tomatometer_certified_fresh";
                                    criticsImage = "rt_certified_fresh.svg";
                                } else if (rt.criticsScore >= 60) {
                                    criticsName = "rt_tomatometer_fresh";
                                    criticsImage = "rt_fresh.svg";
                                } else {
                                    criticsName = "rt_tomatometer_rotten";
                                    criticsImage = "rt_rotten.svg";
                                }

                                rtCriticsScore = {
                                    name: criticsName,
                                    image: criticsImage,
                                    score: `${rt.criticsScore}%`,
                                    url: rtUrl
                                };
                            }

                            // Audience score (Popcornmeter)
                            // States: Fresh/Hot (60%+), Stale (<60%)
                            // Note: Verified Hot requires ticket purchase verification which RT API doesn't expose
                            if (rt.audienceScore > 0) {
                                const isFresh = rt.audienceScore >= 60;

                                rtAudienceScore = {
                                    name: isFresh
                                        ? "rt_popcornmeter_fresh"
                                        : "rt_popcornmeter_stale",
                                    image: isFresh ? "rt_aud_fresh.svg" : "rt_aud_rotten.svg",
                                    score: `${rt.audienceScore}%`,
                                    url: rtUrl
                                };
                            }
                        }
                    }
                } catch (e) {
                    logger.error("[ratings] Rotten Tomatoes fetch failed:", e);
                }
            })()
        );
    }

    await Promise.all(fetchPromises);

    // Build scores array in consistent order: TMDB, IMDb, RT Critics, RT Audience
    const scores: RatingScore[] = [];
    if (tmdbScore) scores.push(tmdbScore);
    if (imdbScore) scores.push(imdbScore);
    if (rtCriticsScore) scores.push(rtCriticsScore);
    if (rtAudienceScore) scores.push(rtAudienceScore);

    const response: RatingsResponse = {
        scores,
        tmdbId: Number(tmdbId),
        mediaType,
        imdbId
    };

    setHeaders({ "Cache-Control": "public, max-age=3600" });

    return json(response);
};
