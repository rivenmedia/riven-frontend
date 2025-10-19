import { defineConfig } from "@hey-api/openapi-ts";
import "dotenv/config";

export default defineConfig({
    input: `${process.env.BACKEND_URL || "http://localhost:8080"}/openapi.json`,
    output: "src/lib/api",
    plugins: [
        "@hey-api/client-fetch",
        "@hey-api/typescript",
        {
            name: "zod",
            types: {
                infer: true
            },
            requests: true,
            responses: {
                enabled: true,
                types: {
                    infer: true
                }
            },
            definitions: true,
            metadata: true
        },
        {
            name: "@hey-api/sdk",
            validator: true
        }
    ]
});
