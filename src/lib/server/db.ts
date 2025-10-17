import { type DB } from "./db.d";
import Database from "better-sqlite3";
import { env } from "$env/dynamic/private";
import { Kysely, SqliteDialect } from "kysely";

import { readFileSync } from "fs";
import { Umzug } from "umzug";

const sqliteDb = new Database(env.DATABASE_URL);
const dialect = new SqliteDialect({
    database: sqliteDb
});

export const db = new Kysely<DB>({
    dialect
});

export const umzug = new Umzug({
    migrations: {
        glob: ["src/lib/server/migrations/*.sql", { cwd: process.cwd() }],
        resolve: ({ name, path, context }) => ({
            name,
            up: async () => {
                const sql = readFileSync(path!, "utf-8");
                const statements = sql
                    .split(";")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);

                for (const statement of statements) {
                    context.exec(statement);
                }
            },
            down: async () => {
                console.warn(`No down migration for ${name}`);
            }
        })
    },
    context: sqliteDb,
    storage: {
        async logMigration({ name }) {
            sqliteDb.prepare("INSERT INTO _migrations (name) VALUES (?)").run(name);
        },
        async unlogMigration({ name }) {
            sqliteDb.prepare("DELETE FROM _migrations WHERE name = ?").run(name);
        },
        async executed() {
            // Create migrations table if it doesn't exist
            sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

            const migrations = sqliteDb
                .prepare("SELECT name FROM _migrations ORDER BY id")
                .all() as Array<{ name: string }>;

            return migrations.map((m) => m.name);
        }
    },
    logger: console
});
