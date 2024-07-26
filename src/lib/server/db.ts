import type { DB } from './types'; // this is the Database interface we defined earlier
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { env } from '$env/dynamic/private';

const dialect = new SqliteDialect({
	database: new SQLite(env.DATABASE_URL)
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<DB>({
	dialect
});
