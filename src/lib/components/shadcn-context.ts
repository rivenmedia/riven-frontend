import { browser } from "$app/environment";
import { setThemeContext } from "@sjsf/shadcn4-theme";
import * as components from "$lib/components/ui";
import * as extraComponents from "$lib/components/ui/extras";

export interface ShadcnContextOptions {
    componentOverrides?: Record<string, unknown>;
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
