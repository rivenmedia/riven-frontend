import { SvelteSet } from "svelte/reactivity";

export class ItemStore {
    #selectedItems = new SvelteSet<number>();

    get items() {
        return [...this.#selectedItems];
    }

    get count() {
        return this.#selectedItems.size;
    }

    clear() {
        this.#selectedItems.clear();
    }

    has(id: number | null | undefined): boolean {
        return id != null && this.#selectedItems.has(id);
    }

    toggle(id: number | null | undefined) {
        if (id == null) return;

        if (this.#selectedItems.has(id)) {
            this.#selectedItems.delete(id);
        } else {
            this.#selectedItems.add(id);
        }
    }
}
