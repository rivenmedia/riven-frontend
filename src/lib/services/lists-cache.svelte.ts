import { browser } from "$app/environment";

export class MediaListStore {
    #key: string;
    #apiPath: string;
    #items = $state<any[]>([]);
    #timeWindow = $state<"day" | "week" | null>(null);
    #loading = $state<boolean>(false);
    #error = $state<string | null>(null);
    #page = $state<number>(1);
    #hasMore = $state<boolean>(true);

    constructor(key: string, apiPath: string, initialTimeWindow: "day" | "week" | null = null) {
        this.#key = key;
        this.#apiPath = apiPath;
        this.#timeWindow = initialTimeWindow;

        if (browser && initialTimeWindow) {
            const savedWindow = sessionStorage.getItem(`${key}TimeWindow`);
            if (savedWindow && (savedWindow === "day" || savedWindow === "week")) {
                this.#timeWindow = savedWindow;
            }
        }
    }

    get items() {
        // Load items on first access
        if ($effect.tracking() && this.#items.length === 0 && !this.#loading) {
            $effect(() => {
                this.load();
            });
        }
        return this.#items;
    }

    get timeWindow() {
        return this.#timeWindow;
    }

    get loading() {
        return this.#loading;
    }

    get error() {
        return this.#error;
    }

    get hasMore() {
        return this.#hasMore;
    }

    getStorageKey(): string {
        return this.#timeWindow ? `${this.#key}_${this.#timeWindow}` : this.#key;
    }

    getApiUrl(page: number = 1): string {
        const baseUrl = this.#timeWindow
            ? `${this.#apiPath}/${this.#timeWindow}/trending`
            : this.#apiPath;
        return `${baseUrl}?page=${page}`;
    }

    async changeTimeWindow(window: "day" | "week"): Promise<void> {
        if (this.#timeWindow === window) return;

        this.#timeWindow = window;
        if (browser) {
            sessionStorage.setItem(`${this.#key}TimeWindow`, window);
        }

        this.#page = 1;
        this.#hasMore = true;
        await this.load();
    }

    async load(): Promise<void> {
        if (!browser) return;

        const storageKey = this.getStorageKey();
        const storedData = sessionStorage.getItem(storageKey);

        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                this.#items = parsedData.results || parsedData.data?.Page?.media || parsedData;
                return;
            } catch (e) {
                console.error(`Error parsing stored data for ${this.#key}:`, e);
            }
        }

        await this.fetchFromApi();
    }

    async fetchFromApi(): Promise<void> {
        try {
            this.#loading = true;
            this.#error = null;

            const response = await fetch(this.getApiUrl(this.#page));
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${this.getApiUrl(this.#page)}`);
            }

            const result = await response.json();
            if (browser) {
                sessionStorage.setItem(this.getStorageKey(), JSON.stringify(result));
            }

            this.#items = result.results || result.data?.Page?.media || result;
        } catch (error) {
            console.error(`Error fetching data from ${this.getApiUrl(this.#page)}:`, error);
            this.#error = error instanceof Error ? error.message : String(error);
        } finally {
            this.#loading = false;
        }
    }

    async loadMore(): Promise<void> {
        if (!browser || this.#loading || !this.#hasMore) return;

        try {
            this.#loading = true;
            this.#error = null;
            this.#page += 1;

            const response = await fetch(this.getApiUrl(this.#page));
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${this.getApiUrl(this.#page)}`);
            }

            const result = await response.json();
            const newItems = result.results || result.data?.Page?.media || result;

            if (newItems.length === 0) {
                this.#hasMore = false;
            } else {
                this.#items = [...this.#items, ...newItems];
            }
        } catch (error) {
            console.error(`Error loading more data from ${this.getApiUrl(this.#page)}:`, error);
            this.#error = error instanceof Error ? error.message : String(error);
            this.#page -= 1;
        } finally {
            this.#loading = false;
        }
    }

    clearCache(): void {
        if (browser) {
            sessionStorage.removeItem(this.getStorageKey());
        }
    }
}
