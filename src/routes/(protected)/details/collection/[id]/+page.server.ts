import type { PageServerLoad } from "./$types";
import providers, { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import { error } from "@sveltejs/kit";

export interface CollectionMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string | null;
    year: number | null;
    vote_average: number | null;
    vote_count: number | null;
}

export interface CollectionDetails {
    id: number;
    name: string;
    overview: string | null;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: CollectionMovie[];
}

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

    // Transform the collection data
    const collection: CollectionDetails = {
        id: collectionData.id ?? 0,
        name: collectionData.name ?? "",
        overview: collectionData.overview ?? null,
        poster_path: collectionData.poster_path
            ? `${TMDB_IMAGE_BASE_URL}/w500${collectionData.poster_path}`
            : null,
        backdrop_path: collectionData.backdrop_path
            ? `${TMDB_IMAGE_BASE_URL}/original${collectionData.backdrop_path}`
            : null,
        parts: (collectionData.parts ?? [])
            .map((movie) => ({
                id: movie.id ?? 0,
                title: movie.title ?? movie.original_title ?? "",
                original_title: movie.original_title ?? "",
                overview: movie.overview ?? null,
                poster_path: movie.poster_path
                    ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`
                    : null,
                backdrop_path: movie.backdrop_path
                    ? `${TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}`
                    : null,
                release_date: movie.release_date ?? null,
                year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
                vote_average: movie.vote_average ?? null,
                vote_count: movie.vote_count ?? null
            }))
            .sort((a, b) => {
                // Sort by release date
                if (a.release_date && b.release_date) {
                    return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
                }
                return 0;
            })
    };

    return {
        collection
    };
}) satisfies PageServerLoad;
