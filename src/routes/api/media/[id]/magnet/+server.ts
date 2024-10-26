import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const id = params.id;
	const magnet = (await request.json())['magnet'];

	if (!magnet) {
		return new Response(
			JSON.stringify({
				error: 'No magnet provided'
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}

	const url = new URL(`${locals.backendUrl}/items/${id}/set_torrent_rd_magnet`);
	url.searchParams.set('magnet', magnet);

	try {
		const response = await fetch(url, {
			method: 'POST'
		});

		const data = await response.json();
		if (response.ok) {
			return new Response(
				JSON.stringify({
					success: 'Magnet link added',
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
					error: data.detail
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
				error: 'Failed to reach backend'
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
