const TMDB_READ_ACCESS_TOKEN: string =
	'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNTkxMmVmOWFhM2IxNzg2Zjk3ZTE1NWY1YmQ3ZjY1MSIsInN1YiI6IjY1M2NjNWUyZTg5NGE2MDBmZjE2N2FmYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.xrIXsMFJpI1o1j5g2QpQcFP1X3AfRjFA5FlBFO5Naw8';
const HEADERS: Record<string, string> = {
	Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
	'Content-Type': 'application/json;charset=utf-8'
};
const TMDB_BASE_URL: string = 'https://api.themoviedb.org/3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dictToQueryString(params: Record<string, any>): string {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const filteredParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
	return new URLSearchParams(filteredParams).toString();
}

export enum MediaType {
	All = 'all',
	Movie = 'movie',
	TV = 'tv',
	Person = 'person'
}

export enum TimeWindow {
	Day = 'day',
	Week = 'week'
}

export async function getTrending(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	page: number = 1,
	mediaType: MediaType = MediaType.Movie,
	timeWindow: TimeWindow = TimeWindow.Week
) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(
		`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?${queryString}`,
		{
			headers: HEADERS
		}
	);
	if (!response.ok) {
		throw new Error('Failed to fetch trending');
	}
	return await response.json();
}

export async function getMoviesNowPlaying(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	page: number = 1
) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/movie/now_playing?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movies');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMoviesPopular(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/movie/popular?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movies');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMoviesTopRated(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/movie/top_rated?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movies');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMoviesUpcoming(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/movie/upcoming?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movies');
	}
	return await response.json();
}

export async function getMovieDetails(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	append_to_response: string | null = null,
	movieId: number
) {
	const params = { language, append_to_response };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movie details');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTVAiringToday(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/tv/airing_today?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV shows');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTVOnTheAir(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/tv/on_the_air?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV shows');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTVPopular(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/tv/popular?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV shows');
	}
	return await response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTVTopRated(fetch: any, language: string = 'en-US', page: number = 1) {
	const params = { language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/tv/top_rated?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV shows');
	}
	return await response.json();
}

export async function getTVDetails(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	append_to_response: string | null = null,
	tvId: number
) {
	const params = { language, append_to_response };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV show details');
	}
	return await response.json();
}

export async function getTVSeasonDetails(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	append_to_response: string | null = null,
	tvId: number,
	seasonNumber: number
) {
	const params = { language, append_to_response };
	const queryString = dictToQueryString(params);

	const response = await fetch(
		`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?${queryString}`,
		{
			headers: HEADERS
		}
	);
	if (!response.ok) {
		throw new Error('Failed to fetch TV season details');
	}
	return await response.json();
}

export async function getTVEpisodeDetails(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	append_to_response: string | null = null,
	tvId: number,
	seasonNumber: number,
	episodeNumber: number
) {
	const params = { language, append_to_response };
	const queryString = dictToQueryString(params);

	const response = await fetch(
		`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?${queryString}`,
		{
			headers: HEADERS
		}
	);
	if (!response.ok) {
		throw new Error('Failed to fetch TV episode details');
	}
	return await response.json();
}

export async function getFromExternalID(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	external_source: string,
	external_id: string
) {
	const params = { language, external_source, external_id };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/find/${external_id}?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch external ID');
	}
	return await response.json();
}

export async function getCollectionSearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	query: string,
	include_adult: boolean = false,
	language: string = 'en-US',
	page: number = 1,
	region: string | null = null
) {
	const params = { query, include_adult, language, page, region };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/search/collection?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch collection search');
	}
	return await response.json();
}

export async function getMovieSearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	query: string,
	include_adult: boolean = false,
	language: string = 'en-US',
	primary_release_year: number | null = null,
	page: number = 1,
	region: string | null = null,
	year: number | null = null
) {
	const params = { query, include_adult, language, primary_release_year, page, region, year };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/search/movie?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch movie search');
	}
	return await response.json();
}

export async function getMultiSearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	query: string,
	include_adult: boolean = false,
	language: string = 'en-US',
	page: number = 1
) {
	const params = { query, include_adult, language, page };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/search/multi?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch multi search');
	}
	return await response.json();
}

export async function getTVSearch(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	query: string,
	first_air_date_year: number | null = null,
	include_adult: boolean = false,
	language: string = 'en-US',
	page: number = 1,
	year: number | null = null
) {
	const params = { query, first_air_date_year, include_adult, language, page, year };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/search/tv?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch TV search');
	}
	return await response.json();
}

export async function getExternalID(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	mediaType: string,
	tmdb_id: number
) {
	const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdb_id}/external_ids`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch external ID');
	}
	return await response.json();
}

export async function getCollection(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	collectionId: number
) {
	const params = { language };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/collection/${collectionId}?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch collection details');
	}
	return await response.json();
}

export async function getPerson(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fetch: any,
	language: string = 'en-US',
	append_to_response: string | null = null,
	personId: number
) {
	const params = { language, append_to_response };
	const queryString = dictToQueryString(params);

	const response = await fetch(`${TMDB_BASE_URL}/person/${personId}?${queryString}`, {
		headers: HEADERS
	});
	if (!response.ok) {
		throw new Error('Failed to fetch person details');
	}
	return await response.json();
}
