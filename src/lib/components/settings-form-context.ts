import { setThemeContext } from "@sjsf/shadcn4-theme";
import * as components from "$lib/components/ui";
import * as extraComponents from "$lib/components/ui/extras";

export function setSettingsFormContext() {
    setThemeContext({
        components: {
            ...components,
            ...extraComponents,
            // Use Switch for better visibility and UX best practices for Settings
            Checkbox: components.Switch
        }
    });
}
