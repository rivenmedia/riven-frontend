import type { PageServerLoad } from "./$types";
import providers from "$lib/providers";
import { parseCollectionDetails } from "$lib/providers/parser";
import { error } from "@sveltejs/kit";
import { createCustomFetch } from "$lib/custom-fetch";

export const load = (async ({ fetch, params }) => {
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
                },
                query: {
                    append_to_response: "images"
                }
            },
            fetch: customFetch
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
