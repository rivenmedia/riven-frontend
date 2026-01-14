import { browser } from "$app/environment";
import type { FormState, Schema, UiSchemaRoot } from "@sjsf/form";
import { createForm, getValueSnapshot, validate } from "@sjsf/form";
import { toast } from "svelte-sonner";
import { icons } from "@sjsf/lucide-icons";
import { translation, resolver, merger, validator, idBuilder, theme } from "./form-defaults";

/** Runtime state for a settings section (schemas fetched dynamically from backend). */
export interface SectionData {
    schema: Schema | null;
    uiSchema: UiSchemaRoot | null;
    values: Record<string, unknown> | null;
    form: FormState<unknown> | null;
    isLoading: boolean;
    error: string | null;
    clientErrors: string[];
    serverError: string | null;
}

function createEmptySection(isLoading = false): SectionData {
    return {
        schema: null,
        uiSchema: null,
        values: null,
        form: null,
        isLoading,
        error: null,
        clientErrors: [],
        serverError: null
    };
}

export class SettingsStore {
    #sections = $state<Record<string, SectionData>>({});
    #activeSection = $state<string>("");
    #savingSectionId = $state<string | null>(null);

    // Navigation intent state (for unsaved changes dialog)
    #pendingSection = $state<string | null>(null);
    #showUnsavedDialog = $state(false);

    constructor() {
        $effect(() => {
            const sectionId = this.#activeSection;
            if (browser && sectionId) {
                this.loadSection(sectionId);
            }
        });
    }

    get activeSection() {
        return this.#activeSection;
    }

    get savingSectionId() {
        return this.#savingSectionId;
    }

    get showUnsavedDialog() {
        return this.#showUnsavedDialog;
    }

    get pendingSection() {
        return this.#pendingSection;
    }

    getSection(id: string): SectionData | undefined {
        return this.#sections[id];
    }

    setActiveSection(id: string) {
        this.#activeSection = id;
    }

    #switchSection(id: string) {
        if (id === this.#activeSection) return;
        this.reset();
        this.#activeSection = id;
    }

    async loadSection(sectionId: string): Promise<void> {
        const existing = this.#sections[sectionId];
        if (existing?.form || existing?.isLoading) return;

        this.#sections[sectionId] = createEmptySection(true);

        try {
            const response = await fetch(
                `/settings/api?sectionId=${encodeURIComponent(sectionId)}`
            );
            if (!response.ok) throw new Error(`Failed to load (${response.status})`);

            const data = await response.json();
            const form = createForm({
                theme,
                translation,
                resolver,
                merger,
                validator,
                idBuilder,
                icons,
                schema: data.schema,
                uiSchema: data.uiSchema,
                initialValue: data.values
            });

            this.#sections[sectionId] = {
                schema: data.schema,
                uiSchema: data.uiSchema,
                values: data.values,
                form,
                isLoading: false,
                error: null,
                clientErrors: [],
                serverError: null
            };
        } catch (error) {
            this.#sections[sectionId] = {
                ...createEmptySection(),
                error: error instanceof Error ? error.message : "Failed to load"
            };
            toast.error("Failed to load settings section");
        }
    }

    async save(sectionId?: string): Promise<boolean> {
        const targetId = sectionId ?? this.#activeSection;
        const section = this.#sections[targetId];
        if (!section?.form) return false;

        section.clientErrors = [];
        section.serverError = null;

        // Client-side validation
        const validationResult = validate(section.form);
        if (validationResult.errors && validationResult.errors.length > 0) {
            section.clientErrors = validationResult.errors.map((e) => e.message);
            toast.error("Please fix validation errors before saving");
            return false;
        }

        const values = getValueSnapshot(section.form);
        this.#savingSectionId = targetId;

        try {
            const response = await fetch("/settings/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionId: targetId, values })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = Array.isArray(errorData.errors)
                    ? errorData.errors[0]
                    : (errorData.message ?? "Failed to save settings");
                section.serverError = errorMessage;
                toast.error(errorMessage);
                return false;
            }

            // Recreate form with saved values as new initialValue (clears isChanged)
            // Schema/uiSchema are guaranteed non-null since form exists
            section.form = createForm({
                theme,
                translation,
                resolver,
                merger,
                validator,
                idBuilder,
                icons,
                schema: section.schema!,
                uiSchema: section.uiSchema!,
                initialValue: values
            });
            section.values = values as Record<string, unknown>;
            toast.success("Settings saved");
            return true;
        } catch {
            section.serverError = "Network error - please check your connection";
            toast.error("Failed to save settings");
            return false;
        } finally {
            this.#savingSectionId = null;
        }
    }

    retry(sectionId?: string) {
        const targetId = sectionId ?? this.#activeSection;
        delete this.#sections[targetId];
        this.loadSection(targetId);
    }

    reset(sectionId?: string) {
        const targetId = sectionId ?? this.#activeSection;
        const section = this.#sections[targetId];
        if (!section?.form) return;

        section.form.reset();
        section.clientErrors = [];
        section.serverError = null;
    }

    hasUnsavedChanges(sectionId?: string): boolean {
        const targetId = sectionId ?? this.#activeSection;
        const section = this.#sections[targetId];
        return section?.form?.isChanged ?? false;
    }

    hasAnyUnsavedChanges(): boolean {
        return Object.values(this.#sections).some((section) => section.form?.isChanged);
    }

    /**
     * Attempt to navigate to a section. If there are unsaved changes,
     * shows the confirmation dialog instead of navigating immediately.
     */
    navigateTo(sectionId: string): void {
        if (sectionId === this.#activeSection) return;

        if (this.hasUnsavedChanges()) {
            this.#pendingSection = sectionId;
            this.#showUnsavedDialog = true;
        } else {
            this.#switchSection(sectionId);
        }
    }

    /** Confirm navigation, discarding unsaved changes. */
    confirmNavigation(): void {
        if (this.#pendingSection) {
            this.#switchSection(this.#pendingSection);
            this.#pendingSection = null;
        }
        this.#showUnsavedDialog = false;
    }

    /** Cancel pending navigation, keeping current section. */
    cancelNavigation(): void {
        this.#pendingSection = null;
        this.#showUnsavedDialog = false;
    }
}
