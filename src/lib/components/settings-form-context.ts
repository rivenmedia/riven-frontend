import { setThemeContext } from "@sjsf/shadcn4-theme";
import * as components from "$lib/components/ui";
import * as extraComponents from "$lib/components/ui/extras";

/**
 * Configure the shadcn theme context for the settings form.
 *
 * Merges core UI components and extra components into the theme context and aliases `Checkbox` to `Switch`.
 */
export function setSettingsFormContext() {
    setThemeContext({
        components: {
            ...components,
            ...extraComponents,
            Checkbox: components.Switch
        }
    });
}