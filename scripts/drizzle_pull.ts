import { execSync } from "child_process";
import { renameSync, existsSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Run drizzle-kit pull
console.log("Running drizzle-kit pull...");

try {
    execSync("drizzle-kit pull", { stdio: "inherit" });
    console.log("drizzle-kit pull completed successfully.");

    // Define source and destination paths
    const SOURCE_DIR = process.env.DRIZZLE_MIGRATIONS_PATH || "./drizzle";
    const DEST_DIR = process.env.DRIZZLE_SCHEMA_PATH || "./src/lib/server/schema";

    // Move files
    const schemaSource = join(SOURCE_DIR, "schema.ts");
    const schemaDest = join(DEST_DIR, "schema.ts");
    const relationsSource = join(SOURCE_DIR, "relations.ts");
    const relationsDest = join(DEST_DIR, "relations.ts");

    if (existsSync(schemaSource)) {
        renameSync(schemaSource, schemaDest);
        console.log(`Moved schema.ts to ${DEST_DIR}`);
    }

    if (existsSync(relationsSource)) {
        renameSync(relationsSource, relationsDest);
        console.log(`Moved relations.ts to ${DEST_DIR}`);
    }

    console.log(`Files moved to ${DEST_DIR}`);
} catch (error) {
    console.error("drizzle-kit pull failed. Exiting...");
    console.error(error);
    process.exit(1);
}
