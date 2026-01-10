import type { RequestHandler } from "./$types";
import providers from "$lib/providers";
import { parseCollectionDetails } from "$lib/providers/parser";
import { error, json } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";

export const GET: RequestHandler = async ({ fetch, params }) => {
    const { id } = params;
    const customFetch = createCustomFetch(fetch);

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
            fetch: customFetch
        }
    );

    if (collectionError) {
        error(500, collectionError);
    }

    const collection = parseCollectionDetails(collectionData);

    return json({ collection });
};
