import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	scrapersSettingsSchema,
	scrapersSettingsToGet,
	scrapersSettingsToPass
} from '$lib/forms/helpers';
import { SettingsService } from '$lib/client';

export const load: PageLoad = async () => {
	const { data } = await SettingsService.getSettings({
		path: {
			paths: scrapersSettingsToGet.join(',')
		}
	});
	const toPassToSchema = scrapersSettingsToPass(data);

	return {
		form: await superValidate(toPassToSchema, zod(scrapersSettingsSchema))
	};
};
