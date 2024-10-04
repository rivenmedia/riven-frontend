import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';
import {
	generalSettingsSchema,
	generalSettingsToGet,
	generalSettingsToPass
} from '$lib/forms/helpers';
import { SettingsService } from '$/client';

export const load: PageServerLoad = async () => {
	const {data} = await SettingsService.getSettings({
		path: {
			paths: generalSettingsToGet.join(',')
		}
	})
	const toPassToSchema = generalSettingsToPass(data);

	return {
		form: await superValidate(toPassToSchema, zod(generalSettingsSchema))
	};
};
