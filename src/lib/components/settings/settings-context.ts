import { getContext, setContext } from "svelte";
import type { SettingsStore } from "./settings-store.svelte";

const SETTINGS_CTX_KEY = Symbol("settings-context");

export function setSettingsContext(store: SettingsStore) {
    setContext(SETTINGS_CTX_KEY, store);
}

export function getSettingsContext(): SettingsStore {
    const store = getContext<SettingsStore | undefined>(SETTINGS_CTX_KEY);
    if (!store) {
        throw new Error(
            "getSettingsContext() must be called within a component that has setSettingsContext()"
        );
    }
    return store;
}
