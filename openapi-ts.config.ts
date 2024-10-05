import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	client: '@hey-api/client-fetch',
	input: 'http://localhost:8080/openapi.json',
	output: 'src/lib/client',
	services: {
		// This does not suppport tree-shaking and could lead to a larger bundle size
		asClass: true
	}
});
