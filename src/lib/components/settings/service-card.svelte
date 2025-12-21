<script lang="ts">
    import { slide } from "svelte/transition";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        description?: string;
        enabled: boolean;
        onToggle: (enabled: boolean) => void;
        children: Snippet;
    }

    let { title, description, enabled, onToggle, children }: Props = $props();

    // Track whether user has explicitly toggled the expanded state
    let userExpandedState = $state<boolean | null>(null);

    // Expanded follows user preference if set, otherwise follows enabled state
    const expanded = $derived(userExpandedState ?? enabled);

    function toggleExpanded() {
        userExpandedState = !expanded;
    }

    // Auto-expand when enabled becomes true
    $effect(() => {
        if (enabled && userExpandedState === false) {
            userExpandedState = null;
        }
    });
</script>

<Card.Root class="overflow-hidden">
    <!-- Using div instead of button to avoid nested button issue (Switch renders a button) -->
    <div
        role="button"
        tabindex="0"
        class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors"
        onclick={toggleExpanded}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpanded();
            }
        }}>
        <div class="flex items-center gap-3">
            <!-- Wrapper to stop click propagation to parent - switch has its own a11y handling -->
            <span role="presentation" onclick={(e: MouseEvent) => e.stopPropagation()}>
                <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => {
                        onToggle(checked);
                        if (checked) userExpandedState = null; // Reset to follow enabled state
                    }} />
            </span>
            <div>
                <h4 class="font-medium">{title}</h4>
                {#if description && !enabled}
                    <p class="text-muted-foreground text-sm">{description}</p>
                {/if}
            </div>
        </div>
        <ChevronDown
            class="text-muted-foreground h-5 w-5 transition-transform duration-200 {expanded
                ? 'rotate-180'
                : ''}" />
    </div>

    {#if expanded}
        <div transition:slide={{ duration: 200 }}>
            <Card.Content class="border-t pt-4">
                {@render children()}
            </Card.Content>
        </div>
    {/if}
</Card.Root>
