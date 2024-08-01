import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

export const POST: RequestHandler = async ({ params }) => {
	const imdb = params.id; // This is the IMDB ID

	try {
		const response = await fetch(`${BACKEND_URL}/actions/request/${imdb}`, {
			method: 'POST'
		});

		if (response.ok) {
			const data = await response.json();
			return new Response(
				JSON.stringify({
					success: 'Media item added',
					data
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		} else {
			return new Response(
				JSON.stringify({
					error: 'Failed to add media item'
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		}
	} catch {
		return new Response(
			JSON.stringify({
				error: 'Failed to add media item'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = params.id;

	try {
		const itemDeleteResponse = await fetch(`${BACKEND_URL}/items/remove?${id}`, {
			method: 'DELETE'
		});

		if (!itemDeleteResponse.ok) {
			return new Response(
				JSON.stringify({
					error: 'Failed to delete media item'
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		}

		const response = await fetch(`${BACKEND_URL}/actions/symlink/${id}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			return new Response(
				JSON.stringify({
					error: 'Failed to delete media item'
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		}

		return new Response(
			JSON.stringify({
				success: 'Media item deleted'
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch {
		return new Response(
			JSON.stringify({
				error: 'Failed to delete media item'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};
