// ---------------------------------------------------------------------------------
// Shared base types
// ---------------------------------------------------------------------------------

export interface TMDBTransformedListItem {
    id: number;
    title: string;
    poster_path: string | null;
    media_type: "movie" | "tv" | "person" | "company";
    year: string | number;
    vote_average: number | null;
    vote_count: number | null;
    popularity?: number;
    indexer: "tmdb" | "tvdb";
    original_language?: string;
    overview?: string;
    backdrop_path?: string | null;
    genre_ids?: number[];
    release_date?: string;
    first_air_date?: string;
    original_title?: string;
}

export interface ParsedGenre {
    id: number;
    name: string;
    slug?: string;
}

export interface ParsedLanguage {
    english_name: string | null;
    iso_639_1: string | null;
    name: string | null;
}

export interface ParsedCastMember {
    id: number;
    name: string;
    character: string | null;
    profile_path: string | null;
    external_source?: "tmdb" | "tvdb";
}

export interface ParsedCrewMember {
    id: number;
    name: string;
    job: string | null;
    profile_path: string | null;
}

export interface ParsedProductionCompany {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string | null;
}

export interface ParsedTrailer {
    id?: string | number;
    name: string;
    site: string | null;
    key?: string;
    url?: string | null;
}

export interface ParsedMediaDetailsBase {
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
    trakt_recommendations: TMDBTransformedListItem[];
}

// ---------------------------------------------------------------------------------
// TMDB types
// ---------------------------------------------------------------------------------

export interface TMDBListItem {
    adult: boolean;
    backdrop_path: string | null;
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    overview: string;
    poster_path: string | null;
    media_type: "movie" | "tv" | "person" | "company";
    original_language: string;
    genre_ids: number[];
    popularity: number;
    release_date?: string;
    first_air_date?: string;
    video?: boolean;
    vote_average: number;
    vote_count: number;
    origin_country?: string[];
    profile_path?: string | null;
    logo_path?: string | null;
}

export interface TMDBCollectionItem {
    backdrop_path: string | null;
    id: number;
    name: string;
    poster_path: string | null;
}

export interface TMDBMovieDetailsBase {
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

export interface TMDBImageItem {
    aspect_ratio: number;
    file_path: string;
    height: number;
    iso_3166_1: string | null;
    iso_639_1: string | null;
    vote_average: number;
    vote_count: number;
    width: number;
}

export interface TMDBVideoItem {
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

export interface TMDBCastItem {
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

export interface TMDBCrewItem {
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

export interface TMDBReleaseDateItem {
    certification: string;
    descriptors: string[];
    iso_639_1: string | null;
    note: string;
    release_date: string;
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
}

// ---------------------------------------------------------------------------------
// TVDB types
// ---------------------------------------------------------------------------------

export interface TVDBSearchItem {
    tvdb_id?: number;
    id?: number;
    type?: string;
    name?: string;
    translations?: { eng?: string };
    image_url?: string;
    year?: string | number;
    first_air_time?: string;
    overview?: string;
    genres?: (string | { name: string })[];
}

export interface TVDBEpisodeItem {
    id: number;
    seriesId: number;
    name: string;
    aired: string | null;
    runtime: number | null;
    nameTranslations: string[] | null;
    overview: string | null;
    overviewTranslations: string[] | null;
    image: string | null;
    imageType: number;
    isMovie: number;
    seasons: unknown | null;
    number: number | null;
    absoluteNumber: number | null;
    seasonNumber: number | null;
    lastUpdated: string | null;
    finaleType: string | null;
    year: string | null;
}

export interface TVDBArtworkItem {
    id: number;
    image: string;
    thumbnail: string;
    language: string | null;
    type: number;
    score: number | null;
    width: number | null;
    height: number | null;
    includesText: boolean | null;
    thumbnailWidth: number | null;
    thumbnailHeight: number | null;
    updatedAt: number | null;
    status: { id: number | null; name: string | null } | null;
    tagOptions: unknown[] | null;
}

export interface TVDBCompanyItem {
    id: number;
    name: string;
    slug: string;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[];
    country: string | null;
    primaryCompanyType: number | null;
    activeDate: string | null;
    inactiveDate: string | null;
    companyType: { companyTypeId: number | null; companyTypeName: string | null } | null;
    parentCompany: {
        id: number | null;
        name: string | null;
        relation: { id: number | null; typeName: string | null } | null;
    } | null;
    tagOptions: unknown[] | null;
}

export interface TVDBCollectionItem {
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

export interface TVDBCharacterItem {
    id: number;
    name: string;
    peopleId: number;
    seriesId: number;
    series: unknown | null;
    movie: unknown | null;
    movieId: number | null;
    episodeId: number | null;
    type: number;
    image: string | null;
    sort: number | null;
    isFeatured: boolean | null;
    url: string;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[] | null;
    peopleType: string | null;
    personName: string | null;
    tagOptions: unknown[] | null;
    personImgURL: string | null;
}

export interface TVDBSeasonItem {
    id: number;
    seriesId: number;
    type: { id: number; name: string; type: string; alternateName: string | null } | null;
    number: number | null;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    image: string | null;
    imageType: number | null;
    companies: {
        studio: string | null;
        network: string | null;
        production: string | null;
        distributor: string | null;
        special_effects: string | null;
    } | null;
    lastUpdated: string | null;
}

export type TVDBAirsDays = {
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
};

type TVDBNetworkItem = {
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
    companyType: { companyTypeId: number | null; companyTypeName: string | null } | null;
    parentCompany: {
        id: number | null;
        name: string | null;
        relation: { id: number | null; typeName: string | null } | null;
    } | null;
    tagOptions: unknown[] | null;
};

export interface TVDBBaseItem {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    nameTranslations: string[] | null;
    overviewTranslations: string[] | null;
    aliases: { language: string; name: string }[];
    firstAired: string | null;
    lastAired: string | null;
    nextAired: string | null;
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
    lastUpdated: number | null;
    averageRuntime: number | null;
    episodes: TVDBEpisodeItem[] | null;
    overview: string | null;
    year: string | null;
    artworks: TVDBArtworkItem[] | null;
    companies: TVDBCompanyItem[] | null;
    originalNetwork: TVDBNetworkItem | null;
    latestNetwork: TVDBNetworkItem | null;
    genres: { id: number; name: string; slug: string }[] | null;
    trailers: { id: number; name: string; url: string; language: string; runtime: number }[] | null;
    lists: TVDBCollectionItem[] | null;
    remoteIds: { id: string; type: number; sourceName: string }[] | null;
    characters: TVDBCharacterItem[] | null;
    airsDays: TVDBAirsDays | null;
    airsTime: string | null;
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
            | { name: string; language: string; isPrimary?: boolean; isAlias?: boolean }[]
            | null;
        overviewTranslations: { overview: string; language: string; isPrimary?: boolean }[] | null;
        aliases: string[] | null;
    };
}

export interface ParsedNetwork {
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

// ---------------------------------------------------------------------------------
// Person types
// ---------------------------------------------------------------------------------

export interface PersonCreditCast {
    id: number;
    title: string;
    original_title: string;
    character: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string | null;
    year: number | null;
    media_type: "movie" | "tv";
    vote_average: number | null;
    vote_count: number | null;
    popularity: number | null;
    indexer?: "tmdb" | "tvdb";
}

export interface PersonCreditCrew {
    id: number;
    title: string;
    original_title: string;
    job: string | null;
    department: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string | null;
    year: number | null;
    media_type: "movie" | "tv";
    vote_average: number | null;
    vote_count: number | null;
    popularity: number | null;
    indexer?: "tmdb" | "tvdb";
}

export interface PersonDetails {
    id: number;
    indexer?: "tmdb" | "tvdb";
    name: string;
    biography: string | null;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string | null;
    gender: string | null;
    popularity: number | null;
    homepage: string | null;
    imdb_id: string | null;
    tvdb_url?: string | null;
    external_ids?: Record<string, string>;
    also_known_as: string[];
    cast_credits: PersonCreditCast[];
    crew_credits: PersonCreditCrew[];
}
