import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { dev } from '$app/environment';
import { SettingsService } from '$lib/client';

export const load: PageServerLoad = async () => {
	async function getAboutInfo() {
		const toGet = ['version', 'symlink'];
		const { data, error: apiError } = await SettingsService.getSettings({
			path: {
				paths: toGet.join(',')
			}
		});
		if (apiError) {
			error(503, 'Unable to fetch settings data. API is down.');
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return data! as any;
	}
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
		settings: await getAboutInfo(),
		frontendVersion
	};
};
