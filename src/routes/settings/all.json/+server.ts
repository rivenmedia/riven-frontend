import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, locals }) => {
	try {
		const response = await fetch(`${locals.BACKEND_URL}/settings/get/all`, {
			method: 'GET'
		});

		if (response.ok) {
			const data = await response.json();
			return new Response(
				JSON.stringify(
					{
						data
					},
					null,
					2
				),
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
					error: 'Failed to get settings'
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		}
	} catch (e) {
		console.error(e);
		return new Response(
			JSON.stringify({
				error: 'Failed to get settings'
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
