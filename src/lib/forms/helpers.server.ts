import { env } from '$env/dynamic/private';
const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

// TODO: Add toCheck
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function setSettings(fetch: any, toSet: any) {
	const settings = await fetch(`${BACKEND_URL}/settings/set`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(toSet)
	});
	const settingsData = await settings.json();

	return {
		data: settingsData
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveSettings(fetch: any) {
	const data = await fetch(`${BACKEND_URL}/settings/save`, {
		method: 'POST'
	});
	const response = await data.json();

	return {
		data: response
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadSettings(fetch: any) {
	const data = await fetch(`${BACKEND_URL}/settings/load`, {
		method: 'GET'
	});
	const response = await data.json();

	return {
		data: response
	};
}
