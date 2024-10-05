import type { PageServerLoad, Actions } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import {
	scrapersSettingsSchema,
	scrapersSettingsToGet,
	scrapersSettingsToPass,
	scrapersSettingsToSet
} from '$lib/forms/helpers';
import { setSettings, saveSettings, loadSettings } from '$lib/forms/helpers.server';
import { SettingsService } from '$lib/client';

export const load: PageServerLoad = async () => {
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

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(scrapersSettingsSchema));

		if (!form.valid) {
			console.log('form not valid');
			return fail(400, {
				form
			});
		}
		const toSet = scrapersSettingsToSet(form);

		try {
			const data = await setSettings(toSet);
			if (!data) {
				return message(form, `Service(s) failed to initialize. Please check your settings.`, {
					status: 400
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _save = await saveSettings();
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const _load = await loadSettings();
		} catch (e) {
			console.error(e);
			return message(form, 'Unable to save settings. API is down.', {
				status: 400
			});
		}

		if (event.url.searchParams.get('onboarding') === 'true') {
			redirect(302, '/?onboarding=true');
		}

		return message(form, 'Settings saved!');
	}
};
