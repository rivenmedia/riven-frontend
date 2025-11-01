export class ItemStore {
    #selectedItems = $state<number[]>([]);

    get items() {
        return this.#selectedItems;
    }

    get count() {
        return this.#selectedItems.length;
    }

    clear() {
        this.#selectedItems = [];
    }

    has(id: number): boolean {
        return this.#selectedItems.indexOf(id) > -1;
    }

    toggle(id: number) {
        const index = this.#selectedItems.indexOf(id);
        if (index > -1) {
            this.#selectedItems.splice(index, 1);
        } else {
            this.#selectedItems.push(id);
        }
    }
}
