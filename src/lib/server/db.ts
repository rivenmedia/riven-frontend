import { type DB } from "./db.d";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { env } from "$env/dynamic/private";

const dialect = new SqliteDialect({
    database: new SQLite(env.DATABASE_URL)
});

export const db = new Kysely<DB>({
    dialect
});
