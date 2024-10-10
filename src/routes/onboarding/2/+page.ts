import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	mediaServerSettingsSchema,
	mediaServerSettingsToGet,
	mediaServerSettingsToPass
} from '$lib/forms/helpers';
import { SettingsService } from '$lib/client';

export const load: PageLoad = async () => {
	const { data } = await SettingsService.getSettings({
		path: {
			paths: mediaServerSettingsToGet.join(',')
		}
	});
	const toPassToSchema = mediaServerSettingsToPass(data);

	return {
		form: await superValidate(toPassToSchema, zod(mediaServerSettingsSchema))
	};
};
