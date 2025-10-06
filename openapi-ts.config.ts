import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
    input: `${process.env.BACKEND_URL || "http://localhost:8080"}/openapi.json`,
    output: "src/lib/api",
    plugins: [
        "@hey-api/client-fetch",
        "@hey-api/typescript",
        {
            compatibilityVersion: 3,
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
