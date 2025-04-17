import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:8080/openapi.json',
    output: { format: 'prettier', path: 'src/lib/client' },
    plugins: ['@hey-api/client-fetch']
});
