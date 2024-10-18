import { SettingsService } from '$lib/client';

// TODO: Add toCheck
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setSettings(toSet: any) {
	const settings = await SettingsService.setSettings({
		body: toSet
	});
	return settings.data;
}

export async function saveSettings() {
	const response = await SettingsService.saveSettings();
	return response.data;
}

export async function loadSettings() {
	const response = await SettingsService.loadSettings();
	return {
		data: response.data
	};
}
