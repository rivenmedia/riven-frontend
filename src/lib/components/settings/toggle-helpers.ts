import { setValue } from "@sjsf/form";
import type { SettingsFormState } from "./form-defaults";

type FormValue = Record<string, unknown>;

/**
 * Creates getter and setter functions for toggling the `enabled` property
 * of nested form objects. Used by settings section components to manage
 * service/provider enable states.
 *
 * @param getForm - Function that returns the SJSF form state (avoids capturing initial value)
 * @param getFormValue - Function that returns the current form value snapshot
 * @param rootKey - The top-level key in the form (e.g., "content", "scraping", "updaters")
 */
export function createToggleHelpers(
    getForm: () => SettingsFormState,
    getFormValue: () => FormValue,
    rootKey: string
) {
    /**
     * Get the enabled state of a named item under the configured root in the current form value.
     *
     * @param itemKey - The key identifying the item within the root section
     * @returns `true` if the item's `enabled` property is `true`, `false` otherwise
     */
    function getEnabled(itemKey: string): boolean {
        const formValue = getFormValue();
        const root = (formValue?.[rootKey] ?? {}) as FormValue;
        const item = root[itemKey] as FormValue | undefined;
        return (item?.enabled as boolean) ?? false;
    }

    /**
     * Update the `enabled` flag for a nested item under the configured root key in the form state.
     *
     * Preserves other fields on the root and the item while setting the item's `enabled` property.
     *
     * @param itemKey - The key of the nested item to update within the root section
     * @param enabled - The value to set for the item's `enabled` flag
     */
    function setEnabled(itemKey: string, enabled: boolean) {
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