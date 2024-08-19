import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const imdb = params.id; // This is the IMDB ID

	try {
		const response = await fetch(`${locals.BACKEND_URL}/items/add?imdb_ids=${imdb}`, {
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

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const id = params.id;

	try {
		const itemDeleteResponse = await fetch(`${locals.BACKEND_URL}/items/remove?ids=${id}`, {
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
