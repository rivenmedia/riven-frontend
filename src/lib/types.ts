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
interface TorboxData {
	id: number;
	created_at: string;
	updated_at: string;
	email: string;
	plan: number;
	total_downloaded: number;
	customer: string;
	server: number;
	is_subscribed: boolean;
	premium_expires_at: string;
	cooldown_until: string;
	auth_id: string;
	user_referral: string;
	base_email: string;
}

export interface TorboxUserResponse {
	success: boolean;
	detail: string;
	data: TorboxData;
	downloader: string;
}

export interface RivenSubtitle {
	id: number;
	language: string;
	file: string;
}

export interface RivenBaseItem {
	id: number;
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
