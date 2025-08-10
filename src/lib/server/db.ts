import { type DB } from './db.d';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { DATABASE_URL } from '$env/static/private';

const dialect = new SqliteDialect({
	database: new SQLite(DATABASE_URL)
});

export const db = new Kysely<DB>({
	dialect
});
