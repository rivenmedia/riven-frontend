export async function sendCustomEvent(event: string, data: Record<string, string> = {}) {
	const headers = new Headers();
	headers.set('X-Custom-Event', event);

	for (const [key, value] of Object.entries(data)) {
		headers.set(`X-${key}`, value);
	}

	const response = await fetch('/', {
		method: 'GET',
		headers: headers
	});

	return response;
}
