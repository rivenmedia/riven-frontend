import { setThemeContext } from "@sjsf/shadcn4-theme";
import * as components from "$lib/components/ui";
import * as extraComponents from "$lib/components/ui/extras";

export function setShadcnContext() {
    setThemeContext({
        components: {
            ...components,
            ...extraComponents
        }
    });
}
