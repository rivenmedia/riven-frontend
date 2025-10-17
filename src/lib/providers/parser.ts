import { TMDB_IMAGE_BASE_URL, TVDB_ARTWORK_BASE_URL } from "./index";

interface ParsedGenre {
    id: number;
    name: string;
    slug?: string;
}

interface ParsedLanguage {
    english_name: string | null;
    iso_639_1: string | null;
    name: string | null;
}

interface ParsedCastMember {
    id: number;
    name: string;
    character: string | null;
    profile_path: string | null;
}

interface ParsedCrewMember {
    id: number;
    name: string;
    job: string | null;
    profile_path: string | null;
}

interface ParsedProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string | null;
}

interface ParsedTrailer {
    id?: string | number;
    name: string;
    site: string | null;
    key?: string;
    url?: string | null;
}

interface ParsedMediaDetailsBase {
    id: number | null;
    type: "movie" | "show";
    title: string | null;
    original_title: string | null;
    original_language: string | null;
    overview: string | null;
    tagline: string | null;
    status: string | null;
    release_date: string | null;
    end_date: string | null;
    next_air_date: string | null;
    year: number | null;
    runtime: number | null;
    formatted_runtime: string | null;
    homepage: string | null;
    backdrop_path: string | null;
    poster_path: string | null;
    logo: string | null;
    trailer: ParsedTrailer | null;
    certification: string | "N/A";
    genres: ParsedGenre[];
    cast: ParsedCastMember[];
    crew: ParsedCrewMember[];
    origin_country: string[];
    spoken_languages: ParsedLanguage[] | null;
    production_companies: ParsedProductionCompany[];
    production_countries: { iso_3166_1: string; name: string }[];
    recommendations: TMDBTransformedListItem[];
    similar: TMDBTransformedListItem[];
}

// Common utility functions
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
// TMDB Interfaces and Functions
// ---------------------------------------------------------------------------------

interface TMDBListItem {
    adult: boolean;
    backdrop_path: string | null;
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    media_type: "movie";
    original_language: string;
    genre_ids: number[];
    popularity: number;
    release_date: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}

interface TMDBCollectionItem {
    backdrop_path: string | null;
    id: number;
    name: string;
    poster_path: string | null;
}

interface TMDBMovieDetailsBase {
    adult: boolean;
    backdrop_path: string | null;
    belongs_to_collection: TMDBCollectionItem | null;
    budget: number;
    genres: { id: number; name: string }[];
    homepage: string | null;
    id: number;
    imdb_id: string | null;
    origin_country: string[];
    original_language: string;
    original_title: string;
    overview: string | null;
    popularity: number | null;
    poster_path: string | null;
    production_companies: {
        id: number;
        logo_path: string | null;
        name: string;
        origin_country: string;
    }[];
    production_countries: { iso_3166_1: string; name: string }[];
    release_date: string | null;
    revenue: number | null;
    runtime: number | null;
    spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
    status: string | null;
    tagline: string | null;
    title: string;
    video: boolean;
    vote_average: number | null;
    vote_count: number | null;
}

interface TMDBImageItem {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_3166_1: string | null;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
    width: number;
}

interface TMDBVideoItem {
    iso_639_1: string | null;
    iso_3166_1: string | null;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: string;
    id: string;
}

interface TMDBCastItem {
    adult: boolean;
    gender: number | null;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null;
    cast_id: number;
    character: string;
    credit_id: string;
    order: number;
}

interface TMDBCrewItem {
    adult: boolean;
    gender: number | null;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null;
    credit_id: string;
    department: string;
    job: string;
}

interface TMDBReleaseDateItem {
    certification: string;
    descriptors: string[];
    iso_639_1: string | null;
    note: string;
    release_date: string; // ISO 8601 date string
    type: number;
}

// external_ids,images,recommendations,similar,videos,credits,release_dates
export interface TMDBMovieDetailsExtended extends TMDBMovieDetailsBase {
    external_ids: {
        imdb_id: string | null;
        wikidata_id: string | null;
        facebook_id: string | null;
        instagram_id: string | null;
        twitter_id: string | null;
    };
    images: {
        backdrops: TMDBImageItem[];
        logos: TMDBImageItem[];
        posters: TMDBImageItem[];
    };
    recommendations: {
        page: number;
        results: TMDBListItem[];
        total_pages: number;
        total_results: number;
    };
    similar: { page: number; results: TMDBListItem[]; total_pages: number; total_results: number };
    videos: { results: TMDBVideoItem[] };
    credits: { cast: TMDBCastItem[]; crew: TMDBCrewItem[] };
    release_dates: { results: { iso_3166_1: string; release_dates: TMDBReleaseDateItem[] }[] };
}

interface TMDBTransformedListItem {
    id: number;
    title: string;
    poster_path: string | null;
    media_type: string;
    year: string | number;
}

export interface ParsedMovieDetails extends ParsedMediaDetailsBase {
    type: "movie";
    adult: boolean;
    vote_average: number | null;
    vote_count: number | null;
    budget: number | null;
    revenue: number | null;
    imdb_id: string | null;
    external_ids: TMDBMovieDetailsExtended["external_ids"];
    collection: {
        id: number;
        name: string;
        poster_path: string | null;
        backdrop_path: string | null;
    } | null;
    trakt_recommendations: TMDBTransformedListItem[];
}

export function transformTMDBList(items: TMDBListItem[] | null) {
    return (
        items?.map((item) => ({
            id: item.id,
            title: item.title || item.original_title,
            poster_path: item.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}` : null,
            media_type: "movie",
            year: item.release_date ? new Date(item.release_date).getFullYear() : "N/A"
        })) || ([] as TMDBTransformedListItem[])
    );
}

function findTMDBBestTrailer(videos: TMDBVideoItem[] | null) {
    if (!videos) return null;

    const officialTrailers = videos.filter(
        (video) => video.type === "Trailer" && video.official === true
    );

    const sorted = officialTrailers.sort((a, b) => {
        if (b.size !== a.size) return b.size - a.size;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

    return sorted.length > 0 ? sorted[0] : null;
}

export function parseTMDBMovieDetails(
    data: TMDBMovieDetailsExtended | null,
    traktRecs: any[] | null = null
): ParsedMovieDetails | null {
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
    const chosenLogo = data.images.logos.length
        ? data.images.logos.find((logo) => logo.iso_639_1 === "en")?.file_path
            ? buildTMDBImage(
                  data.images.logos.find((logo) => logo.iso_639_1 === "en")!.file_path,
                  "w500"
              )
            : buildTMDBImage(data.images.logos[0].file_path, "w500")
        : null;

    return {
        id: data.id ?? null,
        type: "movie",
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
        year: data.release_date ? new Date(data.release_date).getFullYear() : null,
        runtime,
        formatted_runtime: formatRuntime(runtime),
        homepage: data.homepage ?? null,
        backdrop_path: buildTMDBImage(data.backdrop_path, "original"),
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
            profile_path: buildTMDBImage(member.profile_path, "w185")
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
                  backdrop_path: buildTMDBImage(
                      data.belongs_to_collection.backdrop_path,
                      "original"
                  )
              }
            : null,
        trakt_recommendations: transformTraktRecommendations(traktRecs, true)
    };
}

// ---------------------------------------------------------------------------------
// TVDB Interfaces and Functions
// ---------------------------------------------------------------------------------

export interface TVDBBaseItem {
    id: number;
    name: string;
    slug: string;
    image: string | null; // https://artworks.thetvdb.com/banners/posters/81189-10.jpg
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[];
    firstAired: string | null; // 2008-01-20
    lastAired: string | null; // 2013-09-29
    nextAired: string | null; // 2024-11-10
    score: number | null;
    status: {
        id: number;
        name: string;
        recordType: string;
        keepUpdated: boolean;
    } | null;
    originalCountry: string | null;
    originalLanguage: string | null;
    defaultSeasonType: number | null;
    isOrderRandomized: boolean | null;
    lastUpdated: number | null; // 2025-10-09 14:23:05
    averageRuntime: number | null; // in minutes
    episodes: TVDBEpisodeItem[] | null;
    overview: string | null;
    year: string | null; // "2008"
    artworks: TVDBArtworkItem[] | null;
    companies: TVDBCompanyItem[] | null;
    originalNetwork: {
        id: number | null;
        name: string | null;
        slug: string | null;
        nameTranslations: string[] | null;
        overviewTranslations: string[] | null;
        aliases: { language: string; name: string }[];
        country: string | null;
        primaryCompanyType: number | null;
        activeDate: string | null;
        inactiveDate: string | null;
        companyType: {
            companyTypeId: number | null;
            companyTypeName: string | null;
        } | null;
        parentCompany: {
            id: number | null;
            name: string | null;
            relation: {
                id: number | null;
                typeName: string | null;
            } | null;
        } | null;
        tagOptions: unknown[] | null;
    } | null;
    latestNetwork: {
        id: number | null;
        name: string | null;
        slug: string | null;
        nameTranslations: string[] | null;
        overviewTranslations: string[] | null;
        aliases: { language: string; name: string }[];
        country: string | null;
        primaryCompanyType: number | null;
        activeDate: string | null;
        inactiveDate: string | null;
        companyType: {
            companyTypeId: number | null;
            companyTypeName: string | null;
        } | null;
        parentCompany: {
            id: number | null;
            name: string | null;
            relation: {
                id: number | null;
                typeName: string | null;
            } | null;
        } | null;
        tagOptions: unknown[] | null;
    } | null;
    genres: { id: number; name: string; slug: string }[] | null;
    trailers: { id: number; name: string; url: string; language: string; runtime: number }[] | null; // runtime is given 0, not trustworthy
    lists: TVDBCollectionItem[] | null;
    remoteIds: { id: string; type: number; sourceName: string }[] | null;
    characters: TVDBCharacterItem[] | null;
    airsDays: {
        sunday: boolean;
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
    } | null;
    airsTime: string | null; // "21:00"
    seasons: TVDBSeasonItem[] | null;
    tags:
        | { id: number; tag: number; tagName: string; name: string; helpText: string | null }[]
        | null;
    contentRatings:
        | {
              id: number;
              name: string;
              country: string | null;
              description: string;
              contentType: string;
              order: number;
              fullName: unknown | null;
          }[]
        | null;
    seasonTypes: { id: number; name: string; type: string; alternateName: string | null }[] | null;
    translations: {
        nameTranslations:
            | {
                  name: string;
                  language: string;
                  isPrimary?: boolean;
                  isAlias?: boolean;
              }[]
            | null;
        overviewTranslations: { overview: string; language: string; isPrimary?: boolean }[] | null;
        aliases: string[] | null;
    };
}

interface TVDBEpisodeItem {
    id: number;
    seriesId: number;
    name: string;
    aired: string | null; // 2008-01-20
    runtime: number | null; // in minutes
    nameTranslations: string[] | null;
    overview: string | null;
    overviewTranslations: string[] | null;
    image: string | null; // /banners/episodes/81189/3859781.jpg
    imageType: number;
    isMovie: number; // 0 or 1
    seasons: unknown | null; // Not used
    number: number | null; // Episode number
    absoluteNumber: number | null; // Absolute episode number
    seasonNumber: number | null; // Season number
    lastUpdated: string | null; // 2023-03-28 19:46:53
    finaleType: string | null; // "series"
    year: string | null; // "2008"
}

interface TVDBArtworkItem {
    id: number;
    image: string; // https://artworks.thetvdb.com/banners/posters/81189-10.jpg
    thumbnail: string; // https://artworks.thetvdb.com/banners/posters/81189-10_t.jpg
    language: string | null; // "eng"
    type: number;
    score: number | null;
    width: number | null;
    height: number | null;
    includesText: boolean | null;
    thumbnailWidth: number | null;
    thumbnailHeight: number | null;
    updatedAt: number | null; // timestamp
    status: {
        id: number | null;
        name: string | null;
    } | null;
    tagOptions: unknown[] | null;
}

interface TVDBCompanyItem {
    id: number;
    name: string;
    slug: string;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[];
    country: string | null; // "usa"
    primaryCompanyType: number | null;
    activeDate: string | null; // "1990-06-01"
    inactiveDate: string | null; // "2002-05-31"
    companyType: {
        companyTypeId: number | null;
        companyTypeName: string | null;
    } | null;
    parentCompany: {
        id: number | null;
        name: string | null;
        relation: {
            id: number | null;
            typeName: string | null;
        } | null;
    } | null;
    tagOptions: unknown[] | null;
}

interface TVDBCollectionItem {
    id: number;
    name: string;
    overview: string | null;
    url: string;
    isOfficial: boolean | null;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[];
    score: number | null;
    image: string | null;
    imageIsFallback: boolean | null;
    remoteIds: unknown | null;
    tags: unknown[] | null;
}

interface TVDBCharacterItem {
    id: number;
    name: string;
    peopleId: number;
    seriesId: number;
    series: unknown | null;
    movie: unknown | null;
    movieId: number | null;
    episodeId: number | null;
    type: number; // 3 = Actor
    image: string | null; // https://artworks.thetvdb.com/banners/actors/75476.jpg
    sort: number | null;
    isFeatured: boolean | null;
    url: string; // https://thetvdb.com/people/269404-anna-gunn
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[] | null;
    peopleType: string | null; // "Actor"
    personName: string | null; // "Anna Gunn"
    tagOptions: unknown[] | null;
    personImgURL: string | null; // https://artworks.thetvdb.com/banners/v4/actor/269404/photo/61138b8f549b0.jpg
}

interface TVDBSeasonItem {
    id: number;
    seriesId: number;
    type: {
        id: number;
        name: string;
        type: string;
        alternateName: string | null;
    } | null;
    number: number | null;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    image: string | null; // https://artworks.thetvdb.com/banners/seasons/81189-1-3.jpg
    imageType: number | null;
    companies: {
        studio: string | null;
        network: string | null;
        production: string | null;
        distributor: string | null;
        special_effects: string | null;
    } | null;
    lastUpdated: string | null; // 2025-05-29 07:57:48
}

type TVDBAirsDays = {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
};

interface ParsedShowSeason {
    id: number;
    number: number | null;
    name: string | null;
    image: string | null;
    type: string | null;
}

// interface ParsedShowEpisode {
//     id: number;
//     season_number: number | null;
//     episode_number: number | null;
//     absolute_number: number | null;
//     name: string;
//     aired: string | null;
//     runtime: number | null;
//     image: string | null;
// }

interface ParsedNetwork {
    id: number | null;
    name: string | null;
    country: string | null;
}

export interface ParsedShowDetails extends ParsedMediaDetailsBase {
    type: "show";
    score: number | null;
    imdb_id: string | null;
    external_ids: Record<string, string>;
    airing: {
        time: string | null;
        days: string[];
    };
    episode_count: number;
    season_count: number;
    seasons: TVDBSeasonItem[];
    episodes: TVDBEpisodeItem[];
    networks: ParsedNetwork[];
    content_ratings: {
        id: number;
        name: string;
        country: string | null;
        description: string | null;
    }[];
}

function getAirDaysList(airsDays: TVDBAirsDays | null | undefined) {
    if (!airsDays) return [] as string[];
    return Object.entries(airsDays)
        .filter(([, value]) => Boolean(value))
        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1));
}

function selectArtwork(
    artworks: TVDBArtworkItem[] | null | undefined,
    predicate: (art: TVDBArtworkItem) => boolean
) {
    if (!artworks || artworks.length === 0) return null;
    return artworks.find(predicate) ?? artworks[0];
}

export function parseTVDBShowDetails(
    data: TVDBBaseItem | null,
    traktRecs: any[] | null = null
): ParsedShowDetails | null {
    if (!data) return null;

    const runtime = data.averageRuntime ?? null;

    let title = data.name;
    const originalTitle = data.name;

    const engTitle = data.translations?.nameTranslations?.find(
        (t) => t.language === "eng" && !t.isAlias
    )?.name;

    const engAlias = data.translations?.nameTranslations?.find(
        (t) => t.language === "eng" && t.isAlias
    )?.name;

    title = engAlias || engTitle || data.name;

    let overview = data.overview;
    const engOverview = data.translations?.overviewTranslations?.find(
        (t) => t.language === "eng"
    )?.overview;

    overview = engOverview || data.overview;

    const posterPath = data.image
        ? buildTVDBImage(data.image)
        : buildTVDBImage(
              selectArtwork(data.artworks, (art) => art.type === 2 || art.type === 14)?.image ??
                  null
          );

    const backdropPath = buildTVDBImage(
        selectArtwork(data.artworks, (art) => art.type === 3 || art.type === 15)?.image ?? null
    );

    const logoPath = buildTVDBImage(
        selectArtwork(data.artworks, (art) => art.type === 23 || art.type === 25)?.image ?? null
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
            profile_path: buildTVDBImage(character.personImgURL || character.image)
        }));

    const external_ids = (data.remoteIds ?? []).reduce<Record<string, string>>((acc, remote) => {
        if (!remote.id) return acc;
        if (remote.sourceName) {
            const key = remote.sourceName.toLowerCase().replace(/[\s-]+/g, "_");
            acc[key] = remote.id;
        } else {
            acc[`source_${remote.type}`] = remote.id;
        }
        return acc;
    }, {});
    const imdb_id = external_ids.imdb ?? external_ids.imdb_com ?? null;

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

    const seasons = (data.seasons ?? []).filter(
        (season) => season.type?.name === "Aired Order" && season.number !== 0
    );

    const episodes: TVDBEpisodeItem[] = (data.episodes ?? [])
        .filter((episode) => episode.seasonNumber !== 0)
        .map((episode) => ({
            ...episode,
            image: buildTVDBImage(episode.image)
        }));

    const recommendations = transformTraktRecommendations(traktRecs, false);

    return {
        id: data.id ?? null,
        type: "show",
        title: title ?? null,
        original_title: originalTitle ?? null,
        original_language: data.originalLanguage ?? null,
        overview: overview ?? null,
        tagline: null,
        status: data.status?.name ?? null,
        release_date: data.firstAired ?? null,
        end_date: data.lastAired ?? null,
        next_air_date: data.nextAired ?? null,
        year: data.year
            ? Number(data.year)
            : data.firstAired
              ? new Date(data.firstAired).getFullYear()
              : null,
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
        recommendations,
        similar: [],
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

function transformTraktRecommendations(
    items: any[] | null,
    isMovie: boolean = false
): TMDBTransformedListItem[] {
    if (!items || !Array.isArray(items)) return [];

    return items
        .map((item) => {
            const poster = item.images?.poster?.[0]
                ? item.images.poster[0].startsWith("http")
                    ? item.images.poster[0]
                    : `https://${item.images.poster[0]}`
                : null;

            const id = isMovie ? item.ids?.tmdb : item.ids?.tvdb;
            const mediaType = isMovie ? "movie" : "tv";

            return {
                id: id || 0,
                title: item.title || "",
                poster_path: poster,
                media_type: mediaType,
                year: item.year || "N/A"
            };
        })
        .filter((item) => item.id > 0);
}
