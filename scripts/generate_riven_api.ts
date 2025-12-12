import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
	console.error('BACKEND_URL is not defined in .env file');
	process.exit(1);
}

console.log('Generating Riven API client...');

try {
	execSync(
		`pnpx openapi-typescript "${BACKEND_URL}/openapi.json" -o src/lib/providers/riven.ts`,
		{ stdio: 'inherit' }
	);
	console.log('Riven API client generated successfully.');
} catch (error) {
	console.error('Failed to generate Riven API client. Exiting...');
    console.error(error);
	process.exit(1);
}
