export interface NavItem {
	name: string;
	path: string;
}

export interface RDData {
	id: number;
	username: string;
	email: string;
	points: number;
	locale: string;
	avatar: string;
	type: string;
	premium: number;
	expiration: string;
}

export interface RDUserResponse {
	success: boolean;
	data: RDData;
	downloader: string;
}

export interface RivenSubtitle {
	id: number;
	language: string;
	file: string;
}

export interface RivenBaseItem {
	id: string;
	title: string;
	imdb_id: string | null;
	tvdb_id: number | null;
	tmdb_id: number | null;
	state: string;
	aired_at: Date;
	genres: string[];
	is_anime: boolean;
	requested_at: string;
	requested_by: string;
	scraped_at: string | null;
	scraped_times: number | null;
	language: string;
	country: string;
	symlinked: boolean;
	symlinked_at: string;
	symlinked_times: number;
	update_folder: string;
	file: string;
	folder: string;
	symlink_path: string;
	subtitles: Array<RivenSubtitle>;
}

export interface RivenMovie extends RivenBaseItem {
	type: 'Movie';
}

export interface RivenShow extends RivenBaseItem {
	type: 'Show';
	seasons: Array<RivenSeason>;
}

export interface RivenSeason extends RivenBaseItem {
	type: 'Season';
	number: number;
	episodes: Array<RivenEpisode>;
}

export interface RivenEpisode extends RivenBaseItem {
	type: 'Episode';
	number: number;
}

export type RivenItem = RivenMovie | RivenShow | RivenSeason | RivenEpisode;

export interface RivenGetItemsResponse {
	success: boolean;
	items: RivenItem[];
	page: number;
	limit: number;
	total_items: number;
	total_pages: number;
}

export type TMDBItem = {
	backdrop_path: string | null;
	id: number;
	title: string | null;
	name: string | null;
	original_title: string;
	overview: string;
	poster_path: string | null;
	media_type: 'movie' | 'tv' | 'person';
	adult: boolean;
	original_language: string;
	genre_ids: number[];
	popularity: number;
	release_date?: string;
	first_air_date?: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
};

export interface TMDBSearchResponse {
	page: number;
	results: TMDBItem[];
	total_pages: number;
	total_results: number;
}
