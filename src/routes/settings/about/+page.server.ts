import type { PageServerLoad } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { dev } from '$app/environment';

// export const prerender = true;

export const load = (async () => {
	let versionFilePath: string = '/riven/version.txt';
	if (dev) {
		versionFilePath = './version.txt';
	}
	let frontendVersion = 'Unknown';
	try {
		frontendVersion = (await fs.readFile(path.resolve(versionFilePath), 'utf-8')).trim();
	} catch (err) {
		console.error('Error reading frontend version file:', err);
	}

	return {
		frontendVersion
	};
}) satisfies PageServerLoad;
