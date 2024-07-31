import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');

	try {
		await db.deleteFrom('MediaItem').where('_id', '=', Number(id)).executeTakeFirst();
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
