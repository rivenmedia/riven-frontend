import { IsMobile } from "$lib/hooks/is-mobile.svelte";

export class createSidebarStore {
    #isOpen = $state(false);

    get isOpen() {
        return this.#isOpen;
    }

    set isOpen(value: boolean) {
        this.#isOpen = value;
    }

    toggle() {
        this.#isOpen = !this.#isOpen;
    }

    open() {
        this.#isOpen = true;
    }

    close() {
        this.#isOpen = false;
    }
}

export const SidebarStore = new createSidebarStore();

export class createMobileStore {
    #isMobile = $state(new IsMobile());

    get isMobile() {
        return this.#isMobile.current;
    }
}

export const isMobileStore = new createMobileStore();
