import { TMDB_IMAGE_BASE_URL } from "./index";

// TMDB Image Base URL
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// TVDB Image Base URL
export const TVDB_IMAGE_BASE_URL = "https://artworks.thetvdb.com";

// TMDB Interfaces
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

// TVDB Interfaces
interface TVDBApiResponse<T> {
    status: string;
    data: T;
}

export interface TVDBSeriesData {
    id: number;
    name: string;
    slug: string;
    image: string;
    nameTranslations: string[];
    overviewTranslations: string[];
    aliases: TVDBAlias[];
    firstAired: string;
    lastAired: string;
    nextAired: string;
    score: number;
    status: TVDBStatus;
    originalCountry: string;
    originalLanguage: string;
    defaultSeasonType: number;
    isOrderRandomized: boolean;
    lastUpdated: string;
    averageRuntime: number;
    overview: string;
    year: string;
    episodes: TVDBEpisode[];
    artworks: TVDBArtwork[];
    companies: TVDBCompany[];
    originalNetwork: TVDBNetwork;
    latestNetwork: TVDBNetwork;
    genres: TVDBGenre[];
    characters: TVDBCharacter[];
    seasons: TVDBSeason[];
}

interface TVDBAlias {
    language: string;
    name: string;
}

interface TVDBStatus {
    id: number;
    name: string;
    recordType: string;
    keepUpdated: boolean;
}

interface TVDBEpisode {
    id: number;
    seriesId: number;
    name: string;
    aired: string;
    runtime: number;
    nameTranslations: string[] | null;
    overview: string;
    overviewTranslations: string[] | null;
    image: string | null;
    imageType: number | null;
    isMovie: number;
    seasons: any | null;
    number: number;
    absoluteNumber: number;
    seasonNumber: number;
    lastUpdated: string;
    finaleType: string | null;
    airsBeforeSeason?: number;
    airsBeforeEpisode?: number;
    airsAfterSeason?: number;
    year: string | null;
}

interface TVDBArtwork {
    id: number;
    image: string;
    thumbnail: string;
    language: string | null;
    type: number;
    score: number;
    width: number;
    height: number;
    includesText: boolean;
    thumbnailWidth: number;
    thumbnailHeight: number;
    updatedAt: number;
    status: {
        id: number;
        name: string | null;
    };
    tagOptions: any | null;
}

interface TVDBCompany {
    id: number;
    name: string;
    slug: string;
    nameTranslations: string[];
    overviewTranslations: string[];
    aliases: any[];
    country: string;
    primaryCompanyType: number;
    activeDate: string | null;
    inactiveDate: string | null;
    companyType: {
        companyTypeId: number;
        companyTypeName: string;
    };
    parentCompany: {
        id: number | null;
        name: string | null;
        relation: {
            id: number | null;
            typeName: string | null;
        };
    };
    tagOptions: any | null;
}

interface TVDBNetwork extends TVDBCompany {}

interface TVDBGenre {
    id: number;
    name: string;
    slug: string;
}

interface TVDBCharacter {
    id: number;
    name: string;
    peopleId: number;
    seriesId: number;
    series: any | null;
    movie: any | null;
    movieId: any | null;
    episodeId: any | null;
    type: number;
    image: string;
    sort: number;
    isFeatured: boolean;
    url: string;
    nameTranslations: any | null;
    overviewTranslations: any | null;
    aliases: any | null;
    peopleType: string;
    personName: string;
    tagOptions: any | null;
    personImgURL: string;
}

interface TVDBSeason {
    id: number;
    seriesId: number;
    type: {
        id: number;
        name: string;
        type: string;
        alternateName: string | null;
    };
    number: number;
    nameTranslations: string[];
    overviewTranslations: string[];
    image: string | null;
    imageType: number | null;
    companies: {
        studio: any | null;
        network: any | null;
        production: any | null;
        distributor: any | null;
        special_effects: any | null;
    };
    lastUpdated: string;
}

export interface TVDBParsedSeries {
    id: number;
    name: string;
    slug: string;
    overview: string;
    firstAired: string;
    lastAired: string;
    status: string;
    runtime: number;
    network: string;
    country: string;
    language: string;
    genres: string[];
    poster: string | null;
    backdrop: string | null;
    logo: string | null;
    year: string;
    rating: number | null;
    episodes: TVDBParsedEpisode[];
    seasons: TVDBParsedSeason[];
    cast: TVDBParsedCharacter[];
}

export interface TVDBParsedEpisode {
    id: number;
    name: string;
    overview: string;
    seasonNumber: number;
    episodeNumber: number;
    absoluteNumber: number;
    aired: string | null;
    runtime: number;
    image: string | null;
    isMovie: boolean;
    isSpecial: boolean;
    year: string | null;
}

export interface TVDBParsedSeason {
    id: number;
    number: number;
    name: string;
    overview: string | null;
    image: string | null;
    episodes: TVDBParsedEpisode[];
}

export interface TVDBParsedCharacter {
    id: number;
    name: string;
    actorName: string;
    actorId: number;
    image: string | null;
    characterImage: string | null;
    sort: number;
    isFeatured: boolean;
}

function findBestTVDBArtwork(
    artworks: TVDBArtwork[],
    type: number,
    language: string = "eng"
): string | null {
    const filtered = artworks.filter((art) => art.type === type);

    let artwork = filtered.find((art) => art.language === language && art.score > 0);

    if (!artwork) {
        artwork = filtered.find((art) => art.language === language);
    }

    if (!artwork && filtered.length > 0) {
        artwork = filtered.sort((a, b) => b.score - a.score)[0];
    }

    return artwork ? artwork.image : null;
}

export function parseTVDBSeriesData(
    response: TVDBApiResponse<TVDBSeriesData> | null
): TVDBParsedSeries | null {
    if (!response || response.status !== "success" || !response.data) return null;

    const data = response.data;

    const poster = findBestTVDBArtwork(data.artworks, 2);
    const backdrop = findBestTVDBArtwork(data.artworks, 3);
    const logo = findBestTVDBArtwork(data.artworks, 23);

    // Parse episodes by season
    const episodesBySeason: { [key: number]: TVDBParsedEpisode[] } = {};
    const parsedEpisodes = data.episodes
        .filter((ep) => ep.seasonNumber > 0)
        .map((ep) => {
            const parsedEpisode: TVDBParsedEpisode = {
                id: ep.id,
                name: ep.name,
                overview: ep.overview || "",
                seasonNumber: ep.seasonNumber,
                episodeNumber: ep.number,
                absoluteNumber: ep.absoluteNumber,
                aired: ep.aired,
                runtime: ep.runtime,
                image: ep.image ? `${TVDB_IMAGE_BASE_URL}${ep.image}` : null,
                isMovie: ep.isMovie === 1,
                isSpecial: ep.seasonNumber === 0,
                year: ep.year
            };

            if (!episodesBySeason[ep.seasonNumber]) {
                episodesBySeason[ep.seasonNumber] = [];
            }
            episodesBySeason[ep.seasonNumber].push(parsedEpisode);

            return parsedEpisode;
        });

    const parsedSeasons = data.seasons
        .filter((season) => season.type.id === 1 && season.number > 0)
        .map((season) => {
            return {
                id: season.id,
                number: season.number,
                name: `Season ${season.number}`,
                overview: null,
                image: season.image ? `${TVDB_IMAGE_BASE_URL}${season.image}` : null,
                episodes: episodesBySeason[season.number] || []
            };
        })
        .sort((a, b) => a.number - b.number);

    const parsedCharacters = data.characters
        .map((character) => {
            return {
                id: character.id,
                name: character.name,
                actorName: character.personName,
                actorId: character.peopleId,
                image: character.personImgURL ? `${character.personImgURL}` : null,
                characterImage: character.image ? `${TVDB_IMAGE_BASE_URL}${character.image}` : null,
                sort: character.sort,
                isFeatured: character.isFeatured
            };
        })
        .sort((a, b) => a.sort - b.sort);

    const parsedSeries: TVDBParsedSeries = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        overview: data.overview || "",
        firstAired: data.firstAired,
        lastAired: data.lastAired,
        status: data.status.name,
        runtime: data.averageRuntime,
        network: data.originalNetwork?.name || "",
        country: data.originalCountry || "",
        language: data.originalLanguage || "",
        genres: data.genres.map((genre) => genre.name),
        poster: poster,
        backdrop: backdrop,
        logo: logo,
        year: data.year,
        rating: data.score ? Math.round(data.score / 10000) / 10 : null,
        episodes: parsedEpisodes,
        seasons: parsedSeasons,
        cast: parsedCharacters
    };

    return parsedSeries;
}

export function parseTVDBSeasonEpisodes(
    seriesData: TVDBApiResponse<TVDBSeriesData> | null,
    seasonNumber: number
): TVDBParsedEpisode[] | null {
    if (!seriesData || seriesData.status !== "success" || !seriesData.data) return null;

    const data = seriesData.data;

    const episodes = data.episodes
        .filter((ep) => ep.seasonNumber === seasonNumber)
        .map((ep) => {
            return {
                id: ep.id,
                name: ep.name,
                overview: ep.overview || "",
                seasonNumber: ep.seasonNumber,
                episodeNumber: ep.number,
                absoluteNumber: ep.absoluteNumber,
                aired: ep.aired,
                runtime: ep.runtime,
                image: ep.image ? `${TVDB_IMAGE_BASE_URL}${ep.image}` : null,
                isMovie: ep.isMovie === 1,
                isSpecial: ep.seasonNumber === 0,
                year: ep.year
            };
        })
        .sort((a, b) => a.episodeNumber - b.episodeNumber);

    return episodes;
}
