import { TMDB_IMAGE_BASE_URL, TVDB_ARTWORK_BASE_URL } from "$lib/indexer-constants";
import * as dateUtils from "$lib/utils/date";
import type {
    ParsedCastMember,
    ParsedGenre,
    ParsedLanguage,
    ParsedNetwork,
    ParsedProductionCompany,
    ParsedTrailer,
    PersonCreditCast,
    PersonCreditCrew,
    PersonDetails,
    TMDBMovieDetailsExtended,
    TMDBTransformedListItem,
    TMDBVideoItem,
    TVDBAirsDays,
    TVDBArtworkItem,
    TVDBBaseItem,
    TVDBEpisodeItem,
    TVDBSearchItem
} from "./parser.types";

export type {
    ParsedMovieDetails,
    ParsedShowDetails,
    PersonCreditCast,
    PersonCreditCrew,
    PersonDetails,
    TMDBListItem,
    TMDBMovieDetailsExtended,
    TMDBTransformedListItem,
    TVDBBaseItem
} from "./parser.types";

// ---------------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------------

function formatRuntime(totalMinutes: number | null) {
    if (totalMinutes == null || totalMinutes <= 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

function buildTMDBImage(path: string | null, size: string) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

function buildTVDBImage(path: string | null) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${TVDB_ARTWORK_BASE_URL}${path}`;
}

function resolveTrailerSite(url: string | null) {
    if (!url) return null;
    try {
        const { hostname } = new URL(url);
        if (hostname.includes("youtube")) return "YouTube";
        if (hostname.includes("vimeo")) return "Vimeo";
        if (hostname.includes("dailymotion")) return "Dailymotion";
        return hostname;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------------
// TMDB functions
// ---------------------------------------------------------------------------------

// Map TVDB genre strings to TMDB integer IDs
const TVDB_GENRE_MAP: Record<string, number> = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    "Science Fiction": 878,
    "TV Movie": 10770,
    Thriller: 53,
    War: 10752,
    Western: 37,
    // TV Specific
    "Action & Adventure": 10759,
    "Sci-Fi & Fantasy": 10765,
    Reality: 10764,
    News: 10763,
    Kids: 10762,
    Talk: 10767,
    Soap: 10766,
    "War & Politics": 10768
};

export function transformTMDBList(
    items: unknown[] | null,
    type: "movie" | "tv" | "person" | "company" = "movie",
    backdropSize: string = "w1280"
) {
    const seen = new Set<number>();
    return (
        (items as Array<Record<string, unknown>>)?.reduce(
            (acc: TMDBTransformedListItem[], rawItem: Record<string, unknown>) => {
                const item = rawItem as {
                    id?: number;
                    title?: string;
                    name?: string;
                    original_title?: string;
                    original_name?: string;
                    poster_path?: string;
                    profile_path?: string;
                    logo_path?: string;
                    media_type?: "movie" | "tv" | "person" | "company";
                    release_date?: string;
                    first_air_date?: string;
                    vote_average?: number | null;
                    vote_count?: number | null;
                    popularity?: number;
                    original_language?: string;
                    overview?: string;
                    backdrop_path?: string;
                    genre_ids?: number[];
                };
                if (item.id == null || seen.has(item.id)) return acc;
                seen.add(item.id);
                acc.push({
                    id: item.id,
                    title:
                        item.title || item.name || item.original_title || item.original_name || "",
                    poster_path: item.poster_path
                        ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}`
                        : item.profile_path
                          ? `${TMDB_IMAGE_BASE_URL}/w500${item.profile_path}`
                          : item.logo_path
                            ? `${TMDB_IMAGE_BASE_URL}/w500${item.logo_path}`
                            : null,
                    media_type: item.media_type || type,
                    year:
                        (item.media_type || type) === "movie"
                            ? item.release_date
                                ? (dateUtils.getYearFromISO(item.release_date) ?? "N/A")
                                : "N/A"
                            : item.first_air_date
                              ? (dateUtils.getYearFromISO(item.first_air_date) ?? "N/A")
                              : "N/A",
                    vote_average: item.vote_average ? item.vote_average : null,
                    vote_count: item.vote_count ? item.vote_count : null,
                    popularity: item.popularity,
                    indexer: "tmdb" as const,
                    original_language: item.original_language,
                    overview: item.overview,
                    backdrop_path: item.backdrop_path
                        ? `${TMDB_IMAGE_BASE_URL}/${backdropSize}${item.backdrop_path}`
                        : null,
                    genre_ids: item.genre_ids,
                    release_date: item.release_date,
                    first_air_date: item.first_air_date,
                    original_title: item.original_title ?? item.original_name
                });
                return acc;
            },
            [] as TMDBTransformedListItem[]
        ) || ([] as TMDBTransformedListItem[])
    );
}

export function transformTVDBList(items: TVDBSearchItem[] | null): TMDBTransformedListItem[] {
    return (
        items?.reduce((acc, item) => {
            if (item.type !== "series") return acc;

            const id = item.tvdb_id ?? item.id;
            if (!id || id <= 0) return acc;

            // Map genres to IDs (handle both string[] from search and object[] from filter)
            const genreIds: number[] = [];
            if (item.genres) {
                for (const g of item.genres) {
                    const name = typeof g === "string" ? g : g.name;
                    const genreId = TVDB_GENRE_MAP[name];
                    if (typeof genreId === "number" && genreId > 0) genreIds.push(genreId);
                }
            }

            acc.push({
                id,
                title: item.translations?.eng || item.name || "Unknown",
                poster_path: buildTVDBImage(item.image_url ?? null),
                media_type: "tv",
                year: item.year ?? dateUtils.getYearFromISO(item.first_air_time) ?? "N/A",
                vote_average: null,
                vote_count: null,
                genre_ids: genreIds,
                overview: item.overview ?? undefined,
                first_air_date: item.first_air_time ?? undefined,
                indexer: "tvdb"
            });
            return acc;
        }, [] as TMDBTransformedListItem[]) || ([] as TMDBTransformedListItem[])
    );
}

function transformTraktRecommendations(
    items: unknown[] | null,
    isMovie: boolean = false
): TMDBTransformedListItem[] {
    if (!items?.length) return [];

    const seen = new Map<number, TMDBTransformedListItem>();

    for (const rawItem of items) {
        const item = rawItem as {
            images?: { poster?: string[] };
            type?: string;
            movie?: { title?: string; year?: string | number; ids?: { tmdb?: number } };
            show?: { title?: string; year?: string | number; ids?: { tmdb?: number } };
            ids?: { tmdb?: number };
            title?: string;
            year?: string | number;
        };
        const posterRaw = item.images?.poster?.[0];
        const poster = posterRaw
            ? posterRaw.startsWith("http")
                ? posterRaw
                : `https://${posterRaw}`
            : null;

        // Detect type from Trakt response structure
        const isMovieType = item.type === "movie" || item.movie;
        const isShowType = item.type === "show" || item.show;

        const mediaType = isMovieType ? "movie" : isShowType ? "tv" : isMovie ? "movie" : "tv";

        // Always use TMDB IDs for consistent routing (matches search behavior)
        const id =
            mediaType === "movie"
                ? item.ids?.tmdb || item.movie?.ids?.tmdb || 0
                : item.ids?.tmdb || item.show?.ids?.tmdb || 0;

        if (id <= 0) continue;

        const existing = seen.get(id);
        // Keep entry with poster, or add if not seen
        if (!existing || (poster && !existing.poster_path)) {
            seen.set(id, {
                id,
                title: item.title || item.movie?.title || item.show?.title || "",
                poster_path: poster,
                media_type: mediaType,
                year: item.year || item.movie?.year || item.show?.year || "N/A",
                vote_average: null,
                vote_count: null,
                indexer: "tmdb"
            });
        }
    }

    return Array.from(seen.values());
}

function findTMDBBestTrailer(videos: TMDBVideoItem[] | null) {
    if (!videos) return null;

    const officialTrailers = videos.filter(
        (video) => video.type === "Trailer" && video.official === true
    );

    const sorted = officialTrailers.sort((a, b) => {
        if (b.size !== a.size) return b.size - a.size;
        return dateUtils.compareDateStrings(b.published_at, a.published_at);
    });

    return sorted.length > 0 ? sorted[0] : null;
}

export function parseTMDBMovieDetails(
    data: TMDBMovieDetailsExtended | null,
    traktRecs: unknown[] | null = null
) {
    if (!data) return null;

    const runtime = data.runtime ?? null;
    const trailer = data.videos ? findTMDBBestTrailer(data.videos.results) : null;
    const certificationSource = data.release_dates.results.find((r) => r.iso_3166_1 === "US");
    const certificationEntry = certificationSource?.release_dates.find((rd) => rd.certification);
    const certification = certificationEntry?.certification || "N/A";

    const spokenLanguages: ParsedLanguage[] = (data.spoken_languages ?? []).map((language) => ({
        english_name: language.english_name ?? null,
        iso_639_1: language.iso_639_1 ?? null,
        name: language.name ?? null
    }));

    // Choose logo: prefer English (iso_639_1 === "en"), otherwise first available, otherwise null
    const englishLogo = data.images.logos.find((logo) => logo.iso_639_1 === "en");
    const chosenLogo = data.images.logos.length
        ? buildTMDBImage(englishLogo?.file_path ?? data.images.logos[0].file_path, "w500")
        : null;

    return {
        id: data.id ?? null,
        type: "movie" as const,
        adult: data.adult ?? false,
        title: data.title ?? data.original_title ?? null,
        original_title: data.original_title ?? null,
        original_language: data.original_language ?? null,
        overview: data.overview ?? null,
        tagline: data.tagline ?? null,
        status: data.status ?? null,
        release_date: data.release_date ?? null,
        end_date: null,
        next_air_date: null,
        year: dateUtils.getYearFromISO(data.release_date),
        runtime,
        formatted_runtime: formatRuntime(runtime),
        homepage: data.homepage ?? null,
        backdrop_path: buildTMDBImage(data.backdrop_path, "w1920"),
        poster_path: buildTMDBImage(data.poster_path, "w500"),
        logo: chosenLogo,
        trailer: trailer
            ? {
                  id: trailer.id,
                  name: trailer.name,
                  site: trailer.site,
                  key: trailer.key,
                  url:
                      trailer.site === "YouTube"
                          ? `https://www.youtube.com/watch?v=${trailer.key}`
                          : null
              }
            : null,
        certification,
        genres: (data.genres ?? []).map((genre) => ({
            id: genre.id,
            name: genre.name
        })),
        cast: data.credits.cast.slice(0, 10).map((member) => ({
            id: member.id,
            name: member.name,
            character: member.character || null,
            profile_path: buildTMDBImage(member.profile_path, "w185"),
            external_source: "tmdb" as const
        })),
        crew: data.credits.crew
            .filter((member) =>
                ["Director", "Producer", "Screenplay", "Writer"].includes(member.job)
            )
            .map((member) => ({
                id: member.id,
                name: member.name,
                job: member.job,
                profile_path: buildTMDBImage(member.profile_path, "w185")
            })),
        origin_country: data.origin_country ?? [],
        spoken_languages: spokenLanguages,
        production_companies: (data.production_companies ?? []).map((company) => ({
            id: company.id,
            name: company.name,
            logo_path: buildTMDBImage(company.logo_path, "w185"),
            origin_country: company.origin_country ?? null
        })),
        production_countries: data.production_countries ?? [],
        recommendations: transformTMDBList(data.recommendations.results),
        similar: transformTMDBList(data.similar.results),
        vote_average: data.vote_average ?? null,
        vote_count: data.vote_count ?? null,
        budget: data.budget ?? null,
        revenue: data.revenue ?? null,
        imdb_id: data.external_ids.imdb_id ?? null,
        external_ids: data.external_ids,
        collection: data.belongs_to_collection
            ? {
                  id: data.belongs_to_collection.id,
                  name: data.belongs_to_collection.name,
                  poster_path: buildTMDBImage(data.belongs_to_collection.poster_path, "w500"),
                  backdrop_path: buildTMDBImage(data.belongs_to_collection.backdrop_path, "w1920")
              }
            : null,
        trakt_recommendations: transformTraktRecommendations(traktRecs, true)
    };
}

// ---------------------------------------------------------------------------------
// TVDB functions
// ---------------------------------------------------------------------------------

function getAirDaysList(airsDays: TVDBAirsDays | null | undefined) {
    if (!airsDays) return [] as string[];
    return Object.entries(airsDays)
        .filter(([, value]) => Boolean(value))
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
}

function selectArtwork(
    artworks: TVDBArtworkItem[] | null | undefined,
    predicate: (art: TVDBArtworkItem) => boolean,
    preferredLanguage: string | null = "eng"
) {
    if (!artworks || artworks.length === 0) return null;

    const matchingArtworks = artworks.filter(predicate);
    if (matchingArtworks.length === 0) return null;

    const preferredArtworks = matchingArtworks.filter((art) => art.language === preferredLanguage);

    if (preferredArtworks.length > 0) {
        return preferredArtworks.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    }

    return matchingArtworks.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
}

export function parseTVDBShowDetails(
    data: TVDBBaseItem | null,
    traktRecs: unknown[] | null = null
) {
    if (!data) return null;

    const runtime = data.averageRuntime ?? null;
    const originalTitle = data.name;

    const engTitle = data.translations?.nameTranslations?.find(
        (t) => t.language === "eng" && !t.isAlias
    )?.name;

    const engAlias = data.translations?.nameTranslations?.find(
        (t) => t.language === "eng" && t.isAlias
    )?.name;

    const title = engTitle || engAlias || data.name;

    const engOverview = data.translations?.overviewTranslations?.find(
        (t) => t.language === "eng"
    )?.overview;

    const overview = engOverview || data.overview;

    const posterPath = buildTVDBImage(
        selectArtwork(data.artworks, (art) => art.type === 2 || art.type === 14, "eng")?.image ??
            data.image
    );

    const backdropPath = buildTVDBImage(
        selectArtwork(data.artworks, (art) => art.type === 3 || art.type === 15, null)?.image ??
            null
    );

    const logoPath = buildTVDBImage(
        selectArtwork(data.artworks, (art) => art.type === 23 || art.type === 25, "eng")?.image ??
            null
    );

    function extractYoutubeKey(url: string | null): string | undefined {
        if (!url) return undefined;
        try {
            if (url.includes("youtube.com/watch")) {
                const urlObj = new URL(url);
                return urlObj.searchParams.get("v") || undefined;
            }
            if (url.includes("youtu.be/")) {
                const parts = url.split("/");
                return parts[parts.length - 1].split("?")[0];
            }
        } catch {
            return undefined;
        }
        return undefined;
    }

    const trailerEntry = data.trailers?.find((item) => Boolean(item.url)) ?? null;
    const trailer: ParsedTrailer | null = trailerEntry
        ? {
              id: trailerEntry.id,
              name: trailerEntry.name,
              site: resolveTrailerSite(trailerEntry.url),
              url: trailerEntry.url,
              key: extractYoutubeKey(trailerEntry.url)
          }
        : null;

    const certification =
        data.contentRatings?.find(
            (rating) =>
                rating.country &&
                data.originalCountry &&
                rating.country.toLowerCase() === data.originalCountry.toLowerCase()
        )?.name ??
        data.contentRatings?.[0]?.name ??
        "N/A";

    const genres: ParsedGenre[] = (data.genres ?? []).map((genre) => ({
        id: genre.id,
        name: genre.name,
        slug: genre.slug
    }));

    const spoken_languages: ParsedLanguage[] | null = null;

    const productionCompanies: ParsedProductionCompany[] = (data.companies ?? []).map(
        (company) => ({
            id: company.id,
            name: company.name,
            logo_path: null,
            origin_country: company.country
        })
    );

    const productionCountrySet = new Set(
        (data.companies ?? [])
            .map((company) => company.country)
            .filter((country): country is string => Boolean(country))
    );
    const production_countries = Array.from(productionCountrySet).map((country) => ({
        iso_3166_1: country.toUpperCase(),
        name: country
    }));

    const cast: ParsedCastMember[] = (data.characters ?? [])
        .filter((character) => character.type === 3)
        .slice(0, 10)
        .map((character) => ({
            id: character.peopleId || character.id,
            name: character.personName || character.name,
            character: character.name,
            profile_path: buildTVDBImage(character.personImgURL || character.image),
            external_source: "tvdb" as const
        }));

    // Map TVDB sourceName to normalized keys
    const sourceNameMap: Record<string, string> = {
        "themoviedb.com": "tmdb",
        themoviedb: "tmdb",
        tmdb: "tmdb",
        "imdb.com": "imdb",
        imdb: "imdb",
        "official website": "official",
        twitter: "twitter",
        instagram: "instagram",
        facebook: "facebook",
        reddit: "reddit",
        wikidata: "wikidata",
        fansite: "fansite"
    };
    const external_ids = (data.remoteIds ?? []).reduce<Record<string, string>>((acc, remote) => {
        if (!remote.id) return acc;
        if (remote.sourceName) {
            const key =
                sourceNameMap[remote.sourceName.toLowerCase()] ?? remote.sourceName.toLowerCase();
            acc[key] = remote.id;
        } else {
            acc[`source_${remote.type}`] = remote.id;
        }
        return acc;
    }, {});
    const imdb_id = external_ids.imdb ?? null;

    const networks: ParsedNetwork[] = [];
    if (data.originalNetwork) {
        networks.push({
            id: data.originalNetwork.id,
            name: data.originalNetwork.name,
            country: data.originalNetwork.country
        });
    }
    if (
        data.latestNetwork &&
        (!data.originalNetwork || data.latestNetwork.id !== data.originalNetwork.id)
    ) {
        networks.push({
            id: data.latestNetwork.id,
            name: data.latestNetwork.name,
            country: data.latestNetwork.country
        });
    }

    const seasons = (data.seasons ?? [])
        .filter((season) => season.type?.name === "Aired Order" && season.number !== 0)
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

    const episodes: TVDBEpisodeItem[] = (data.episodes ?? []).reduce<TVDBEpisodeItem[]>(
        (acc, episode) => {
            if (episode.seasonNumber !== 0) {
                acc.push({ ...episode, image: buildTVDBImage(episode.image) });
            }
            return acc;
        },
        []
    );

    const trakt_recommendations = transformTraktRecommendations(traktRecs, false);

    return {
        id: data.id ?? null,
        type: "show" as const,
        title: title ?? null,
        original_title: originalTitle ?? null,
        original_language: data.originalLanguage ?? null,
        overview: overview ?? null,
        tagline: null,
        status: data.status?.name ?? null,
        release_date: data.firstAired ?? null,
        end_date: data.lastAired ?? null,
        next_air_date: data.nextAired ?? null,
        year: data.year ? Number(data.year) : dateUtils.getYearFromISO(data.firstAired),
        runtime,
        formatted_runtime: formatRuntime(runtime),
        homepage: data.slug ? `https://thetvdb.com/series/${data.slug}` : null,
        backdrop_path: backdropPath,
        poster_path: posterPath,
        logo: logoPath,
        trailer,
        certification,
        genres,
        cast,
        crew: [],
        origin_country: data.originalCountry ? [data.originalCountry] : [],
        spoken_languages,
        production_companies: productionCompanies,
        production_countries,
        recommendations: [],
        similar: [],
        trakt_recommendations,
        score: data.score ?? null,
        imdb_id,
        external_ids,
        airing: {
            time: data.airsTime,
            days: getAirDaysList(data.airsDays)
        },
        episode_count: episodes.length,
        season_count: seasons.length,
        seasons,
        episodes,
        networks,
        content_ratings: (data.contentRatings ?? []).map((rating) => ({
            id: rating.id,
            name: rating.name,
            country: rating.country,
            description: rating.description
        }))
    };
}

// ---------------------------------------------------------------------------------
// Person parser
// ---------------------------------------------------------------------------------

function pickString(...values: unknown[]): string | null {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return null;
}

function pickNumber(...values: unknown[]): number | null {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }
    return null;
}

function getGenderString(gender: number | null): string | null {
    switch (gender) {
        case 1:
            return "Female";
        case 2:
            return "Male";
        case 3:
            return "Non-binary";
        default:
            return null;
    }
}

function normalizeTvdbGender(value: unknown): string | null {
    if (typeof value === "number") {
        if (value === 1) return "Male";
        if (value === 2) return "Female";
        return null;
    }
    if (typeof value === "string") return value || null;
    if (value && typeof value === "object") {
        const item = value as Record<string, unknown>;
        return pickString(item.name, item.gender);
    }
    return null;
}

function tvdbRemoteIds(data: Record<string, unknown>) {
    const ids = Array.isArray(data.remoteIds) ? (data.remoteIds as Record<string, unknown>[]) : [];
    const normalized: Record<string, string> = {};

    for (const remote of ids) {
        if (!remote?.id) continue;
        const source = pickString(remote.sourceName, remote.sourceType, remote.type);
        if (!source) continue;
        normalized[source.toLowerCase().replace(".com", "")] = String(remote.id);
    }

    return normalized;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function tvdbAliases(data: Record<string, unknown>) {
    const d = data as {
        aliases?: unknown[];
        translations?: { nameTranslations?: Array<{ name?: string }> };
        nameTranslations?: Array<{ name?: string }>;
        name?: string;
    };
    const aliases = new Set<string>();

    for (const alias of d.aliases ?? []) {
        const name = pickString((alias as Record<string, unknown>)?.name, alias);
        if (name) aliases.add(name);
    }

    const translations = d.translations?.nameTranslations ?? d.nameTranslations ?? [];
    for (const translation of translations) {
        const name = pickString(translation?.name);
        if (name && name !== d.name) aliases.add(name);
    }

    return [...aliases];
}

function sortByReleaseDateDesc<T extends { release_date: string | null }>(a: T, b: T): number {
    if (a.release_date && b.release_date) {
        return -dateUtils.compareDateStrings(a.release_date, b.release_date);
    }
    return a.release_date ? -1 : b.release_date ? 1 : 0;
}

function transformPersonCredit(credit: Record<string, unknown>) {
    const c = credit as {
        release_date?: string | null;
        first_air_date?: string | null;
        id?: number | null;
        title?: string;
        name?: string;
        original_title?: string;
        original_name?: string;
        poster_path?: string | null;
        backdrop_path?: string | null;
        media_type?: string;
        vote_average?: number | null;
        vote_count?: number | null;
        popularity?: number | null;
    };
    const releaseDate = c.release_date || c.first_air_date || null;
    return {
        id: c.id ?? 0,
        title: c.title || c.name || c.original_title || c.original_name || "",
        original_title: c.original_title || c.original_name || "",
        poster_path: buildTMDBImage(c.poster_path ?? null, "w500"),
        backdrop_path: buildTMDBImage(c.backdrop_path ?? null, "w1920"),
        release_date: releaseDate,
        year: dateUtils.getYearFromISO(releaseDate),
        media_type: (c.media_type === "tv" ? "tv" : "movie") as "movie" | "tv",
        vote_average: c.vote_average ?? null,
        vote_count: c.vote_count ?? null,
        popularity: c.popularity ?? null,
        indexer: "tmdb" as const
    };
}

function transformTVDBPersonCharacterCredit(
    character: Record<string, unknown>
): PersonCreditCast | null {
    const series = asRecord(character.series);
    const movie = asRecord(character.movie);
    const mediaType = character.movieId || movie ? "movie" : "tv";
    const id = pickNumber(
        character.movieId,
        movie?.id,
        character.seriesId,
        series?.id,
        character.parentId
    );

    if (!id) return null;

    const title = pickString(
        movie?.name,
        movie?.title,
        movie?.originalTitle,
        character.movieName,
        series?.name,
        series?.title,
        character.seriesName
    );

    if (!title) return null;

    const releaseDate = pickString(
        movie?.releaseDate,
        asRecord(movie?.firstRelease)?.date,
        movie?.year,
        series?.firstAired,
        series?.year
    );

    const poster = pickString(movie?.image, movie?.poster, series?.image, series?.poster);
    const backdrop = pickString(
        movie?.background,
        movie?.artwork,
        series?.background,
        series?.artwork
    );

    return {
        id,
        title,
        original_title: pickString(movie?.originalTitle, series?.originalName, title) ?? title,
        character: pickString(character.name, character.characterName),
        poster_path: poster ? buildTVDBImage(poster) : null,
        backdrop_path: backdrop ? buildTVDBImage(backdrop) : null,
        release_date: releaseDate,
        year: pickNumber(movie?.year, series?.year) ?? dateUtils.getYearFromISO(releaseDate),
        media_type: mediaType,
        vote_average: pickNumber(movie?.score, series?.score),
        vote_count: null,
        popularity: pickNumber(character.sort, movie?.score, series?.score),
        indexer: "tvdb"
    };
}

export function parsePersonDetails(personData: Record<string, unknown>): PersonDetails {
    const p = personData as {
        id?: number;
        name?: string;
        biography?: string | null;
        birthday?: string | null;
        deathday?: string | null;
        place_of_birth?: string | null;
        profile_path?: string | null;
        known_for_department?: string | null;
        gender?: number | null;
        popularity?: number | null;
        homepage?: string | null;
        external_ids?: Record<string, string> & { imdb_id?: string };
        also_known_as?: string[];
        combined_credits?: {
            cast?: Record<string, unknown>[];
            crew?: Record<string, unknown>[];
        };
    };
    const castCredits: PersonCreditCast[] = (p.combined_credits?.cast ?? []).map((credit) => ({
        ...transformPersonCredit(credit),
        character: (credit.character ?? null) as string | null
    }));

    const crewCredits: PersonCreditCrew[] = (p.combined_credits?.crew ?? []).map((credit) => ({
        ...transformPersonCredit(credit),
        job: (credit.job ?? null) as string | null,
        department: (credit.department ?? null) as string | null
    }));

    castCredits.sort(sortByReleaseDateDesc);
    crewCredits.sort(sortByReleaseDateDesc);

    return {
        id: p.id ?? 0,
        indexer: "tmdb",
        name: p.name ?? "",
        biography: p.biography ?? null,
        birthday: p.birthday ?? null,
        deathday: p.deathday ?? null,
        place_of_birth: p.place_of_birth ?? null,
        profile_path: buildTMDBImage(p.profile_path ?? null, "h632"),
        known_for_department: p.known_for_department ?? null,
        gender: getGenderString(p.gender ?? null),
        popularity: p.popularity ?? null,
        homepage: p.homepage ?? null,
        imdb_id: p.external_ids?.imdb_id ?? null,
        tvdb_url: null,
        external_ids: p.external_ids ?? {},
        also_known_as: p.also_known_as ?? [],
        cast_credits: castCredits,
        crew_credits: crewCredits
    };
}

export function parseTVDBPersonDetails(response: Record<string, unknown>): PersonDetails {
    const rawData = asRecord(response.data) ?? response;
    const data = rawData as {
        id?: number;
        name?: string;
        biography?: string;
        overview?: string;
        bio?: string;
        biographies?: Array<{ language?: string; biography?: string }>;
        translations?: {
            overviewTranslations?: Array<{ language?: string; overview?: string }>;
            biographies?: Array<{ language?: string; biography?: string }>;
        };
        image?: string;
        personImgURL?: string;
        photo?: string;
        thumbnail?: string;
        birth?: string;
        birthday?: string;
        birthDate?: string;
        death?: string;
        deathday?: string;
        deathDate?: string;
        birthPlace?: string;
        placeOfBirth?: string;
        birthplace?: string;
        peopleType?: string;
        type?: string;
        knownForDepartment?: string;
        gender?: unknown;
        score?: number;
        url?: string;
        characters?: Record<string, unknown>[];
    };
    const remoteIds = tvdbRemoteIds(rawData);
    const characterCredits: PersonCreditCast[] = (
        Array.isArray(data.characters) ? data.characters : []
    )
        .map(transformTVDBPersonCharacterCredit)
        .filter((credit: PersonCreditCast | null): credit is PersonCreditCast => Boolean(credit))
        .sort(sortByReleaseDateDesc);

    const biography = pickString(
        data.biography,
        data.overview,
        data.bio,
        data.biographies?.find((t) => t?.language === "eng")?.biography,
        data.translations?.overviewTranslations?.find((t) => t?.language === "eng")?.overview,
        data.translations?.biographies?.find((t) => t?.language === "eng")?.biography
    );
    const image = pickString(data.image, data.personImgURL, data.photo, data.thumbnail);

    return {
        id: data.id ?? 0,
        indexer: "tvdb",
        name: data.name ?? "",
        biography,
        birthday: pickString(data.birth, data.birthday, data.birthDate),
        deathday: pickString(data.death, data.deathday, data.deathDate),
        place_of_birth: pickString(data.birthPlace, data.placeOfBirth, data.birthplace),
        profile_path: image ? buildTVDBImage(image) : null,
        known_for_department: pickString(data.peopleType, data.type, data.knownForDepartment),
        gender: normalizeTvdbGender(data.gender),
        popularity: typeof data.score === "number" ? data.score : null,
        homepage: data.url ? `https://thetvdb.com${data.url}` : null,
        imdb_id: remoteIds.imdb ?? null,
        tvdb_url: data.url ? `https://thetvdb.com${data.url}` : null,
        external_ids: remoteIds,
        also_known_as: tvdbAliases(rawData),
        cast_credits: characterCredits,
        crew_credits: []
    };
}

export function parseCompanyDetails(
    companyData: Record<string, unknown>,
    movies: TMDBTransformedListItem[],
    shows: TMDBTransformedListItem[]
): PersonDetails {
    const c = companyData as {
        id?: number;
        name?: string;
        description?: string;
        headquarters?: string;
        origin_country?: string;
        logo_path?: string | null;
        homepage?: string | null;
    };
    const castCredits: PersonCreditCast[] = [
        ...movies.map((m) => {
            const rawYear = m.year;
            const yearNum = rawYear != null ? Number(rawYear) : null;
            return {
                id: m.id,
                title: m.title,
                original_title: m.original_title || m.title,
                character: "Production",
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path || null,
                release_date: m.release_date || null,
                year: Number.isFinite(yearNum) ? Number(yearNum) : null,
                media_type: "movie" as const,
                vote_average: m.vote_average,
                vote_count: m.vote_count,
                popularity: m.popularity || 0
            };
        }),
        ...shows.map((s) => {
            const rawYear = s.year;
            const yearNum = rawYear != null ? Number(rawYear) : null;
            return {
                id: s.id,
                title: s.title,
                original_title: s.original_title || s.title,
                character: "Production",
                poster_path: s.poster_path,
                backdrop_path: s.backdrop_path || null,
                release_date: s.first_air_date || null,
                year: Number.isFinite(yearNum) ? Number(yearNum) : null,
                media_type: "tv" as const,
                vote_average: s.vote_average,
                vote_count: s.vote_count,
                popularity: s.popularity || 0
            };
        })
    ].sort(sortByReleaseDateDesc);

    return {
        id: c.id ?? 0,
        indexer: "tmdb",
        name: c.name ?? "",
        biography: c.description || `Headquarters: ${c.headquarters || "Unknown"}`,
        birthday: null,
        deathday: null,
        place_of_birth: c.origin_country ?? null,
        profile_path: buildTMDBImage(c.logo_path ?? null, "w500"),
        known_for_department: "Production",
        gender: null,
        popularity: null,
        homepage: c.homepage ?? null,
        imdb_id: null,
        tvdb_url: null,
        external_ids: {},
        also_known_as: [],
        cast_credits: castCredits,
        crew_credits: []
    };
}
