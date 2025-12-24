import { customFetch } from "$lib/custom-fetch";

interface ImdbTitle {
    id: string;
    title: string;
    image?: string;
    rating?: {
        aggregateRating?: number;
        voteCount?: number;
    };
    [key: string]: any;
}

interface PendingRequest {
    id: string;
    resolve: (title: ImdbTitle | null) => void;
    reject: (err: any) => void;
}

class ImdbService {
    private queue: PendingRequest[] = [];
    private timeout: NodeJS.Timeout | null = null;
    private readonly BATCH_SIZE = 5;
    private readonly DEBOUNCE_MS = 200;

    async getTitle(id: string): Promise<ImdbTitle | null> {
        return new Promise((resolve, reject) => {
            this.queue.push({ id, resolve, reject });
            this.processQueue();
        });
    }

    private processQueue() {
        if (this.queue.length >= this.BATCH_SIZE) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            this.flush();
        } else if (!this.timeout) {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                this.flush();
            }, this.DEBOUNCE_MS);
        }
    }

    private async flush() {
        if (this.queue.length === 0) return;

        const batch = this.queue.splice(0, this.BATCH_SIZE);
        const ids = batch.map((item) => item.id);
        const uniqueIds = [...new Set(ids)];

        console.log("Fetching titles for IDs:", uniqueIds);

        try {
            const params = new URLSearchParams();
            uniqueIds.forEach((id) => params.append("titleIds", id));

            const response = await customFetch(
                `https://api.imdbapi.dev/titles:batchGet?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(`IMDb API error: ${response.statusText}`);
            }

            const data = await response.json();

            const titles: ImdbTitle[] = data.titles || [];
            const titleMap = new Map(titles.map((t) => [t.id, t]));

            batch.forEach((req) => {
                const title = titleMap.get(req.id);
                req.resolve(title || null);
            });
        } catch (error) {
            console.error("IMDb Batch Fetch Error:", error);
            batch.forEach((req) => {
                req.reject(error);
            });
        }
    }
}

export const imdbService = new ImdbService();
