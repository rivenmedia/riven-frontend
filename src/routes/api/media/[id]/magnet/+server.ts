import { ItemsService, ScrapeService } from'$/client';
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

	const url = new URL(`${locals.BACKEND_URL}/items/${id}/set_torrent_rd_magnet`);
	url.searchParams.set('magnet', magnet);

	try {
		const {data, error} = await ItemsService.setTorrentRdMagnet({
			path: {
				id: parseInt(id)
			},
			query: {
				magnet: magnet,
			}
		});

		if (data) {
			return new Response(
				JSON.stringify({
					success: 'Magnet link added',
					data: data
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
		} else if (error) {
			return new Response(
				JSON.stringify({
					error: error
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
