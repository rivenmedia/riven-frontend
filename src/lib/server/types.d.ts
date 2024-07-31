export interface AlembicVersion {
  version_num: string;
}

export interface Episode {
  _id: number;
  parent_id: number;
}

export interface MediaItem {
  _id: number;
  active_stream: string | null;
  aired_at: string | null;
  alternative_folder: string | null;
  blacklisted_streams: string | null;
  country: string | null;
  file: string | null;
  folder: string | null;
  genres: string | null;
  guid: string | null;
  imdb_id: string | null;
  indexed_at: string | null;
  is_anime: number | null;
  item_id: string;
  key: string | null;
  language: string | null;
  last_state: string | null;
  network: string | null;
  number: number | null;
  overseerr_id: number | null;
  requested_at: string | null;
  requested_by: string | null;
  scraped_at: string | null;
  scraped_times: number | null;
  symlinked: number | null;
  symlinked_at: string | null;
  symlinked_times: number | null;
  title: string | null;
  tmdb_id: string | null;
  tvdb_id: string | null;
  type: string;
  update_folder: string | null;
  year: number | null;
}

export interface Movie {
  _id: number;
}

export interface Season {
  _id: number;
  parent_id: number;
}

export interface Show {
  _id: number;
}

export interface Stream {
  _id: number;
  blacklisted: number;
  infohash: string;
  lev_ratio: string;
  parent_id: number;
  parsed_title: string;
  rank: number;
  raw_title: string;
}

export interface DB {
  alembic_version: AlembicVersion;
  Episode: Episode;
  MediaItem: MediaItem;
  Movie: Movie;
  Season: Season;
  Show: Show;
  Stream: Stream;
}
