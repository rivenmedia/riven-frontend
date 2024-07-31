import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { toast } from 'svelte-sonner';

const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

export const POST: RequestHandler = async ({ url, params }) => {
	const data = await fetch(`${BACKEND_URL}/actions/request/tt` + params.id, {
		method: 'POST'
	});

	if (data.status !== 200) {
		toast.error('Failed to request item.');
		return new Response(
			JSON.stringify({
				error: 'Failed to request item'
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
			success: 'Successfully requested item'
		}),
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		}
	);
};
