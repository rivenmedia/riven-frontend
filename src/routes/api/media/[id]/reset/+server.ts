import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const id = params.id;

	try {
		const response = await fetch(`${locals.BACKEND_URL}/items/reset?ids=${id}`, {
			method: 'POST'
		});

		if (response.ok) {
			const data = await response.json();
			return new Response(
				JSON.stringify({
					success: 'Media item reset',
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
					error: 'Failed to reset media item'
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
				error: 'Failed to reset media item'
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
