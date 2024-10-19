import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { pathname } = url;
	const backendUrl = new URL(pathname, locals.backendUrl);
	const apiKey = locals.apiKey;

	try {
		const response = await fetch(`${backendUrl.toString()}${url.search}`, {
			headers: {
				'x-api-key': apiKey
			}
		});
		return json(await response.json(), {
			status: response.status
		});
	} catch {
		throw error(500, 'Failed to fetch data from backend');
	}
};

export const PUT: RequestHandler = async ({ locals, url, request }) => {
	const { pathname } = url;
	const backendUrl = new URL(pathname, locals.backendUrl);
	const apiKey = locals.apiKey;

	try {
		const response = await fetch(`${backendUrl.toString()}${url.search}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey
			},
			body: await request.text()
		});
		return json(await response.json(), {
			status: response.status
		});
	} catch {
		throw error(500, 'Failed to fetch data from backend');
	}
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const { pathname } = url;
	const backendUrl = new URL(pathname, locals.backendUrl);
	const apiKey = locals.apiKey;

	try {
		const response = await fetch(`${backendUrl.toString()}${url.search}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey
			},
			body: await request.text()
		});
		return json(await response.json(), {
			status: response.status
		});
	} catch {
		throw error(500, 'Failed to fetch data from backend');
	}
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	const { pathname } = url;
	const backendUrl = new URL(pathname, locals.backendUrl);
	const apiKey = locals.apiKey;

	try {
		const response = await fetch(`${backendUrl.toString()}${url.search}`, {
			method: 'DELETE',
			headers: {
				'x-api-key': apiKey
			}
		});
		return json(await response.json(), {
			status: response.status
		});
	} catch {
		throw error(500, 'Failed to fetch data from backend');
	}
};
