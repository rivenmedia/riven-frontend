import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { SettingsService } from '$lib/client';

export const load: PageLoad = async ({ data }) => {
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
	const frontendVersion = data.frontendVersion;

	return {
		settings: await getAboutInfo(),
		frontendVersion
	};
};
