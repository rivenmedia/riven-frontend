export interface RatingsData {
    scores: Array<{ name: string; image?: string; score: string; url: string }>;
}

const ratingsCache = new Map<string, Promise<RatingsData>>();

async function fetchRatings(id: number, type: string, signal?: AbortSignal): Promise<RatingsData> {
    const response = await fetch(`/api/ratings/${id}?type=${type}`, { signal });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ratings: status=${response.status} id=${id} type=${type} text=${await response.text()}`
        );
    }
    return response.json();
}

export function getRatings(id: number, type: string, signal?: AbortSignal): Promise<RatingsData> {
    const key = `${type}-${id}`;
    if (ratingsCache.has(key)) {
        return ratingsCache.get(key)!;
    }

    const promise = fetchRatings(id, type, signal).catch((err) => {
        // Remove from cache on failure (including abort) so it can be retried
        if (ratingsCache.get(key) === promise) {
            ratingsCache.delete(key);
        }
        throw err;
    });

    ratingsCache.set(key, promise);
    return promise;
}
