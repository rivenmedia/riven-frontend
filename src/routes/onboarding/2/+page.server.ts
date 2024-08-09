import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { error } from '@sveltejs/kit';
import {
	mediaServerSettingsSchema,
	mediaServerSettingsToGet,
	mediaServerSettingsToPass
} from '$lib/forms/helpers';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	async function getPartialSettings() {
		try {
			const results = await fetch(
				`${locals.BACKEND_URL}/settings/get/${mediaServerSettingsToGet.join(',')}`
			);
			return await results.json();
		} catch (e) {
			console.error(e);
			error(503, 'Unable to fetch settings data. API is down.');
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data: any = await getPartialSettings();
	const toPassToSchema = mediaServerSettingsToPass(data);

	return {
		form: await superValidate(toPassToSchema, zod(mediaServerSettingsSchema))
	};
};
