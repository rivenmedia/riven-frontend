import { setValue } from "@sjsf/form";
import type { SettingsFormState } from "./form-defaults";

type FormValue = Record<string, unknown>;

/** Return type for createToggleHelpers */
export interface ToggleHelpers {
    /** Gets the enabled state of a nested item */
    getEnabled: (itemKey: string) => boolean;
    /** Sets the enabled state of a nested item, preserving other properties */
    setEnabled: (itemKey: string, enabled: boolean) => void;
}

/**
 * Creates getter and setter functions for toggling the `enabled` property
 * of nested form objects. Used by settings section components to manage
 * service/provider enable states.
 *
 * @param getForm - Function that returns the SJSF form state (avoids capturing initial value)
 * @param getFormValue - Function that returns the current form value snapshot
 * @param rootKey - The top-level key in the form (e.g., "content", "scraping", "updaters")
 * @returns Object containing getEnabled and setEnabled functions
 *
 * @example
 * ```ts
 * const { getEnabled, setEnabled } = createToggleHelpers(
 *     () => form,
 *     () => getValueSnapshot(form),
 *     "scraping"
 * );
 * const isEnabled = getEnabled("torrentio");
 * setEnabled("torrentio", true);
 * ```
 */
export function createToggleHelpers(
    getForm: () => SettingsFormState,
    getFormValue: () => FormValue,
    rootKey: string
): ToggleHelpers {
    /**
     * Gets the enabled state of a nested item.
     * @param itemKey - The key of the item within the root section
     * @returns Whether the item is enabled (defaults to false if not set)
     */
    function getEnabled(itemKey: string): boolean {
        const formValue = getFormValue();
        const root = (formValue?.[rootKey] ?? {}) as FormValue;
        const item = root[itemKey] as FormValue | undefined;
        return (item?.enabled as boolean) ?? false;
    }

    /**
     * Sets the enabled state of a nested item, preserving other properties.
     * @param itemKey - The key of the item within the root section
     * @param enabled - The new enabled state
     */
    function setEnabled(itemKey: string, enabled: boolean): void {
        const formValue = getFormValue();
        const currentRoot = (formValue?.[rootKey] ?? {}) as FormValue;
        const currentItem = (currentRoot[itemKey] ?? {}) as FormValue;

        setValue(getForm(), {
            [rootKey]: {
                ...currentRoot,
                [itemKey]: {
                    ...currentItem,
                    enabled
                }
            }
        });
    }

    return { getEnabled, setEnabled };
}
