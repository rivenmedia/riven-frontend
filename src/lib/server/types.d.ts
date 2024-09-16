import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface AlembicVersion {
  version_num: string;
}

export interface Episode {
  _id: number;
  parent_id: number;
}

export interface MediaItem {
  _id: Generated<number>;
  active_stream: Json | null;
  aired_at: Timestamp | null;
  alternative_folder: string | null;
  country: string | null;
  file: string | null;
  folder: string | null;
  genres: Json | null;
  guid: string | null;
  imdb_id: string | null;
  indexed_at: Timestamp | null;
  is_anime: boolean | null;
  item_id: string;
  key: string | null;
  language: string | null;
  last_state: string | null;
  network: string | null;
  number: number | null;
  overseerr_id: number | null;
  requested_at: Timestamp | null;
  requested_by: string | null;
  requested_id: number | null;
  scraped_at: Timestamp | null;
  scraped_times: number | null;
  symlink_path: string | null;
  symlinked: boolean | null;
  symlinked_at: Timestamp | null;
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
  _id: Generated<number>;
  infohash: string;
  lev_ratio: number;
  parsed_title: string;
  rank: number;
  raw_title: string;
}

export interface StreamBlacklistRelation {
  _id: Generated<number>;
  media_item_id: number;
  stream_id: number;
}

export interface StreamRelation {
  _id: Generated<number>;
  child_id: number;
  parent_id: number;
}

export interface Subtitle {
  _id: Generated<number>;
  file: string | null;
  language: string;
  parent_id: number;
}

export interface DB {
  alembic_version: AlembicVersion;
  Episode: Episode;
  MediaItem: MediaItem;
  Movie: Movie;
  Season: Season;
  Show: Show;
  Stream: Stream;
  StreamBlacklistRelation: StreamBlacklistRelation;
  StreamRelation: StreamRelation;
  Subtitle: Subtitle;
}
