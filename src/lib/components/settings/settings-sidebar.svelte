<script lang="ts">
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";
    import { ScrollArea } from "$lib/components/ui/extras/scroll-area";
    import { getErrors } from "@sjsf/form";
    import { SETTINGS_SECTIONS, type SettingsSection } from "./settings-sections";
    import type { SettingsFormState } from "./form-defaults";
    import CircleAlert from "@lucide/svelte/icons/circle-alert";

    interface Props {
        activeSection: string;
        form: SettingsFormState;
        onSectionChange: (sectionId: string) => void;
    }

    let { activeSection, form, onSectionChange }: Props = $props();

    function sectionHasErrors(section: SettingsSection): boolean {
        const errors = getErrors(form);
        for (const [fieldPath] of errors) {
            // fieldPath is an RPath (array), skip empty paths
            if (fieldPath.length === 0) continue;
            // Check if first element matches section path
            const firstPathElement = fieldPath[0];
            for (const path of section.paths) {
                if (firstPathElement === path) {
                    return true;
                }
            }
        }
        return false;
    }
</script>

<aside class="bg-muted/40 flex w-64 flex-col border-r">
    <div class="border-b p-4">
        <h2 class="text-lg font-semibold">Settings</h2>
        <p class="text-muted-foreground text-sm">Configure your Riven instance</p>
    </div>

    <ScrollArea class="flex-1">
        <nav class="space-y-1 p-2">
            {#each SETTINGS_SECTIONS as section (section.id)}
                {@const hasErrors = sectionHasErrors(section)}
                <Button
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    class={cn(
                        "w-full justify-start gap-2",
                        hasErrors && "border-destructive border"
                    )}
                    onclick={() => onSectionChange(section.id)}>
                    <section.icon class="h-4 w-4" />
                    <span class="flex-1 text-left">{section.label}</span>
                    {#if hasErrors}
                        <CircleAlert class="text-destructive h-4 w-4" />
                    {/if}
                </Button>
            {/each}
        </nav>
    </ScrollArea>
</aside>
