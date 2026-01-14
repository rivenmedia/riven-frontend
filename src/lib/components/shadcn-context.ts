import { browser } from "$app/environment";
import { setThemeContext } from "@sjsf/shadcn4-theme";
import type { Component } from "svelte";
import * as components from "$lib/components/ui";
import * as extraComponents from "$lib/components/ui/extras";

export interface ShadcnContextOptions {
    /** Override specific shadcn components. Keys should match component names used by the theme. */
    componentOverrides?: Record<string, Component>;
}

export function setShadcnContext(options?: ShadcnContextOptions): void {
    if (!browser) return;

    setThemeContext({
        components: {
            ...components,
            ...extraComponents,
            ...options?.componentOverrides
        }
    });
}
