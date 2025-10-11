import { TMDB_IMAGE_BASE_URL, TVDB_ARTWORK_BASE_URL } from "./index";

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

export interface TMDBParsedMovieDetails {
    id: number | null;
    adult: boolean;
    title: string | null;
    original_title: string | null;
    original_language: string | null;
    overview: string | null;
    tagline: string | null;
    status: string | null;
    release_date: string | null;
    genres: { id: number; name: string }[];
    vote_average: number | null;
    budget: number | null;
    revenue: number | null;
    homepage: string | null;
    year: number | null;
    runtime: number | null;
    formatted_runtime: string | null;
    backdrop_path: string | null;
    poster_path: string | null;
    logo: string | null;
    trailer: TMDBVideoItem | null;
    certification: string | "N/A";
    imdb_id: string | null;
    external_ids: {
        imdb_id: string | null;
        wikidata_id: string | null;
        facebook_id: string | null;
        instagram_id: string | null;
        twitter_id: string | null;
    };
    cast: {
        id: number;
        name: string;
        character: string;
        profile_path: string | null;
    }[];
    crew: {
        id: number;
        name: string;
        job: string;
        profile_path: string | null;
    }[];
    recommendations: TMDBTransformedListItem[];
    similar: TMDBTransformedListItem[];
    collection: {
        id: number;
        name: string;
        poster_path: string | null;
        backdrop_path: string | null;
    } | null;
    origin_country: string[];
    spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
    production_companies: {
        id: number;
        name: string;
        logo_path: string | null;
        origin_country: string;
    }[];
    production_countries: { iso_3166_1: string; name: string }[];
}

export function parseTMDBMovieDetails(data: TMDBMovieDetailsExtended | null) {
    if (!data) return null;

    const result: TMDBParsedMovieDetails = {} as TMDBParsedMovieDetails;

    result.id = data.id || null; // TMDB ID
    result.adult = data.adult || false; // Adult content flag
    result.title = data.title || null; // Title
    result.original_title = data.original_title || null; // Original Title
    result.original_language = data.original_language || null; // Original Language
    result.overview = data.overview || null; // Description
    result.tagline = data.tagline || null; // Tagline
    result.status = data.status || null; // Status (e.g., Released)
    result.release_date = data.release_date || null; // Release Date (YYYY-MM-DD)
    result.genres = data.genres || []; // Array of genres
    result.vote_average = data.vote_average || null; // Average rating
    result.budget = data.budget || null; // Budget
    result.revenue = data.revenue || null; // Revenue
    result.homepage = data.homepage || null; // Official homepage URL

    result.year = data.release_date ? new Date(data.release_date).getFullYear() : null; // Release Year
    result.runtime = data.runtime || null; // Runtime in minutes
    result.formatted_runtime = data.runtime
        ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
        : null; // Formatted runtime (e.g., "2h 30m")

    result.backdrop_path = data.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL}/original${data.backdrop_path}`
        : null; // Full URL for backdrop image
    result.poster_path = data.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${data.poster_path}` : null; // Full URL for poster image
    result.logo = data.images.logos.length
        ? `${TMDB_IMAGE_BASE_URL}/w500${data.images.logos[0].file_path}`
        : null; // Full URL for logo image

    result.trailer = data.videos ? findTMDBBestTrailer(data.videos.results) : null; // Best trailer video object or null

    const usRelease = data.release_dates.results.find((r) => r.iso_3166_1 === "US");
    if (usRelease && usRelease.release_dates.length > 0) {
        const certificationEntry = usRelease.release_dates.find((rd) => rd.certification);
        result.certification = certificationEntry ? certificationEntry.certification : "N/A";
    } else {
        result.certification = "N/A";
    }

    result.imdb_id = data.external_ids.imdb_id || null; // IMDb ID
    result.external_ids = data.external_ids || {}; // External IDs object

    result.cast = data.credits.cast.slice(0, 10).map((member) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profile_path: member.profile_path
            ? `${TMDB_IMAGE_BASE_URL}/w185${member.profile_path}`
            : null
    })); // Top 10 cast members

    result.crew = data.credits.crew
        .filter((member) => ["Director", "Producer", "Screenplay", "Writer"].includes(member.job))
        .map((member) => ({
            id: member.id,
            name: member.name,
            job: member.job,
            profile_path: member.profile_path
                ? `${TMDB_IMAGE_BASE_URL}/w185${member.profile_path}`
                : null
        })); // Key crew members

    result.recommendations = transformTMDBList(data.recommendations.results); // Recommended movies
    result.similar = transformTMDBList(data.similar.results); // Similar movies

    result.collection = data.belongs_to_collection
        ? {
              id: data.belongs_to_collection.id,
              name: data.belongs_to_collection.name,
              poster_path: data.belongs_to_collection.poster_path
                  ? `${TMDB_IMAGE_BASE_URL}/w500${data.belongs_to_collection.poster_path}`
                  : null,
              backdrop_path: data.belongs_to_collection.backdrop_path
                  ? `${TMDB_IMAGE_BASE_URL}/original${data.belongs_to_collection.backdrop_path}`
                  : null
          }
        : null; // Collection info or null

    result.origin_country = data.origin_country || []; // Origin countries
    result.spoken_languages = data.spoken_languages || []; // Spoken languages
    result.production_companies = data.production_companies.map((company) => ({
        id: company.id,
        name: company.name,
        logo_path: company.logo_path ? `${TMDB_IMAGE_BASE_URL}/w185${company.logo_path}` : null,
        origin_country: company.origin_country
    })); // Production companies
    result.production_countries = data.production_countries || []; // Production countries

    return result;
}

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
