export interface RatingsData {
    scores: Array<{ name: string; image?: string; score: string; url: string }>;
}

const ratingsCache = new Map<string, Promise<RatingsData>>();
const MAX_CACHE_SIZE = 100;

async function fetchRatings(id: number, type: string, signal?: AbortSignal): Promise<RatingsData> {
    const response = await fetch(`/api/ratings/${id}?type=${type}`, { signal });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ratings: status=${response.status} id=${id} type=${type} text=${await response.text()}`
        );
    }
    return response.json();
}

function pruneCache() {
    if (ratingsCache.size >= MAX_CACHE_SIZE) {
        // Map iterates in insertion order, so the first key is the oldest
        const oldestKey = ratingsCache.keys().next().value;
        if (oldestKey) {
            ratingsCache.delete(oldestKey);
        }
    }
}

export function getRatings(id: number, type: string, signal?: AbortSignal): Promise<RatingsData> {
    const key = `${type}-${id}`;
    if (ratingsCache.has(key)) {
        // LRU: Remove and re-add to mark as recently used
        const promise = ratingsCache.get(key)!;
        ratingsCache.delete(key);
        ratingsCache.set(key, promise);
        return promise;
    }

    pruneCache();

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
