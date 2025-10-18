import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
    dialect: "sqlite",
    schema: process.env.DRIZZLE_SCHEMA_PATH || "./src/lib/server/schema",
    out: process.env.DRIZZLE_MIGRATIONS_PATH || "./src/lib/server/migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
});
