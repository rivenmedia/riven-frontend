import { browser } from "$app/environment";

export class MediaListStore {
    #key: string;
    #apiPath: string;
    #items = $state<any[]>([]);
    #timeWindow = $state<"day" | "week" | null>(null);
    #loading = $state<boolean>(false);
    #error = $state<string | null>(null);

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

    getStorageKey(): string {
        return this.#timeWindow ? `${this.#key}_${this.#timeWindow}` : this.#key;
    }

    getApiUrl(): string {
        if (this.#timeWindow) {
            return `${this.#apiPath}/${this.#timeWindow}/trending`;
        }
        return this.#apiPath;
    }

    async changeTimeWindow(window: "day" | "week"): Promise<void> {
        if (this.#timeWindow === window) return;

        this.#timeWindow = window;
        if (browser) {
            sessionStorage.setItem(`${this.#key}TimeWindow`, window);
        }

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

            const response = await fetch(this.getApiUrl());
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${this.getApiUrl()}`);
            }

            const result = await response.json();
            if (browser) {
                sessionStorage.setItem(this.getStorageKey(), JSON.stringify(result));
            }

            this.#items = result.results || result.data?.Page?.media || result;
        } catch (error) {
            console.error(`Error fetching data from ${this.getApiUrl()}:`, error);
            this.#error = error instanceof Error ? error.message : String(error);
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
