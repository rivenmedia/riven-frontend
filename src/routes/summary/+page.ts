import { DefaultService } from '$lib/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	return {
		stats: (await DefaultService.stats()).data,
		services: (await DefaultService.services()).data
	};
};
