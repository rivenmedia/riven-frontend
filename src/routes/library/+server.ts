import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const BACKEND_URL = env.BACKEND_URL || 'http://127.0.0.1:8080';

export async function GET({ url }: { url: URL }) {
    const method = url.searchParams.get('method');
    const imdb_id = url.searchParams.get('imdb_id');

    if (!method || !imdb_id) {
        throw error(400, 'Missing method or imdb_id');
    }

    if (method === "extended") {
        try {
            const res = await fetch(`${BACKEND_URL}/items/extended/${imdb_id}`);
    
            if (res.ok) {
                return new Response(JSON.stringify(await res.json()), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            throw error(400, `Unable to fetch items data: ${res.status} ${res.statusText}`);
        } catch (e) {
            console.error(e);
            throw error(503, 'Unable to fetch items data. Server error or API is down.');
        }
    } else {
        throw error(400, 'Invalid method');
    }
}

export async function DELETE({ url }: { url: URL }) {
    const imdb_id = url.searchParams.get('imdb_id');

    if (!imdb_id) {
        throw error(400, 'Missing method or imdb_id');
    }

    try {
        const res = await fetch(`${BACKEND_URL}/items/remove/?imdb_id=${imdb_id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            return new Response(JSON.stringify(await res.json()), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw error(400, `Unable to delete item: ${res.status} ${res.statusText}`);
    } catch (e) {
        console.error(e);
        throw error(503, 'Unable to delete item. Server error or API is down.');
    }
}