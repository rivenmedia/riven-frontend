import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parseCollectionDetails } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";

export const load = (async ({ fetch, params }) => {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid collection ID");
    }

    const { data: collectionData, error: collectionError } = await providers.tmdb.GET(
        "/3/collection/{collection_id}",
        {
            params: {
                path: {
                    collection_id: Number(id)
                }
            },
            fetch: fetch
        }
    );

    if (collectionError) {
        error(500, collectionError);
    }

    const collection = parseCollectionDetails(collectionData);

    return {
        collection
    };
}) satisfies PageServerLoad;
