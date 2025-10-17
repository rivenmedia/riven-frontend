import { type DB } from "./db.d";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";
import { Kysely, SqliteDialect } from "kysely";

const sqliteDb = new Database(env.DATABASE_URL);
const dialect = new SqliteDialect({
    database: sqliteDb
});

export const db = new Kysely<DB>({
    dialect
});