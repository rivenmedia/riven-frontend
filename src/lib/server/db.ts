import type { DB } from './types.ts';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect, PostgresDialect } from 'kysely';
import { env } from '$env/dynamic/private';
import pkg from 'pg';

const { Pool } = pkg;

let dialect;
const dialectType = env.DIALECT || 'sqlite';
const databaseUrl = env.DATABASE_URL || '';

switch (dialectType) {
	case 'sqlite':
		dialect = new SqliteDialect({
			database: new SQLite(databaseUrl)
		});
		break;
	case 'postgres':
		dialect = new PostgresDialect({
			pool: new Pool({
				connectionString: databaseUrl
			})
		});
		break;
}

export const db = new Kysely<DB>({
	dialect
});
