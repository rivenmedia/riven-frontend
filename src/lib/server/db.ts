import type { DB } from './types.ts';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect, PostgresDialect } from 'kysely';
import { env } from '$env/dynamic/private';
import pkg from 'pg';

const { Pool } = pkg;

let dialect;

if (env.DIALECT) {
	switch (env.DIALECT) {
		case 'sqlite':
			dialect = new SqliteDialect({
				database: new SQLite(env.DATABASE_URL)
			});
			break;
		case 'postgres':
			dialect = new PostgresDialect({
				pool: new Pool({
					connectionString: env.DATABASE_URL
				})
			});
			break;
	}
}

export const db = new Kysely<DB>({
	// @ts-expect-error eslint-disable-next-line @typescript-eslint/ban-ts-comment
	dialect
});
