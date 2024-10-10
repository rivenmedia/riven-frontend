import type { PageLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	generalSettingsSchema,
	generalSettingsToGet,
	generalSettingsToPass
} from '$lib/forms/helpers';
import { SettingsService } from '$lib/client';

export const load: PageLoad = async () => {
	const { data } = await SettingsService.getSettings({
		path: {
			paths: generalSettingsToGet.join(',')
		}
	});
	const toPassToSchema = generalSettingsToPass(data);

	return {
		form: await superValidate(toPassToSchema, zod(generalSettingsSchema))
	};
};
