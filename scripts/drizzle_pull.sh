#!/bin/bash

# Load environment variables
source .env

# Run drizzle-kit pull
echo "Running drizzle-kit pull..."
drizzle-kit pull

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "drizzle-kit pull completed successfully."

    # Define source and destination paths
    SOURCE_DIR="${DRIZZLE_MIGRATIONS_PATH:-./drizzle}"
    DEST_DIR="${DRIZZLE_SCHEMA_PATH:-./src/lib/server/schema}"

    # # Ensure destination directory exists
    # mkdir -p "$DEST_DIR"

    # Move files
    # mv "$SOURCE_DIR/schema.ts" "$DEST_DIR/"
    # mv "$SOURCE_DIR/relations.ts" "$DEST_DIR/"

    # Delete Files
    rm "$SOURCE_DIR/schema.ts"
    rm "$SOURCE_DIR/relations.ts"

    echo "Files deleted"
else
    echo "drizzle-kit pull failed. Exiting..."
    exit 1
fi