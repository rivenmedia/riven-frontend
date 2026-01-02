<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        description?: string;
        hasToggle?: boolean;
        enabled?: boolean;
        onToggle?: (enabled: boolean) => void;
        /** Initial expanded state - if hasToggle is true and no explicit value, defaults to enabled state */
        defaultExpanded?: boolean;
        /** Content to render inside the card */
        children: Snippet;
        /** Additional CSS classes for the Card.Content wrapper */
        contentClass?: string;
    }

    let {
        title,
        description,
        hasToggle = false,
        enabled = false,
        onToggle,
        defaultExpanded,
        children,
        contentClass = ""
    }: Props = $props();

    // Track if user has manually overridden the expanded state
    let userExpandedState = $state<boolean | null>(null);

    // Compute effective expanded state:
    // - If user has set a preference, use that
    // - Otherwise, if hasToggle, follow enabled state
    // - Otherwise use defaultExpanded (defaults to true for non-toggle cards)
    const expanded = $derived(
        userExpandedState ?? (hasToggle ? enabled : (defaultExpanded ?? true))
    );

    function setExpanded(value: boolean) {
        userExpandedState = value;
    }

    function handleToggle(checked: boolean) {
        onToggle?.(checked);
        // When enabling, reset user state so it follows enabled
        if (checked) userExpandedState = null;
    }

    // If enabled becomes true and user had collapsed it, reset to follow enabled
    $effect(() => {
        if (enabled && userExpandedState === false) {
            userExpandedState = null;
        }
    });

    // Generate a unique id for the collapsible content panel
    const contentId = `collapsible-content-${crypto.randomUUID().slice(0, 8)}`;
</script>

<Card.Root class="overflow-hidden">
    <div
        role="button"
        tabindex="0"
        aria-expanded={expanded}
        aria-controls={contentId}
        class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors"
        onclick={() => setExpanded(!expanded)}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded(!expanded);
            }
        }}>
        <div class="flex items-center gap-3">
            {#if hasToggle}
                <span role="presentation" onclick={(e: MouseEvent) => e.stopPropagation()}>
                    <Switch checked={enabled} onCheckedChange={handleToggle} />
                </span>
            {/if}
            <div>
                <h4 class="font-medium">{title}</h4>
                {#if description && (!hasToggle || !enabled)}
                    <p class="text-muted-foreground text-sm">{description}</p>
                {/if}
            </div>
        </div>
        <ChevronDown
            class="text-muted-foreground h-5 w-5 transition-transform duration-200 {expanded
                ? 'rotate-180'
                : ''}" />
    </div>

    <div
        id={contentId}
        class="grid transition-[grid-template-rows] duration-200 ease-out"
        style="grid-template-rows: {expanded ? '1fr' : '0fr'}">
        <div class="overflow-hidden">
            <Card.Content class="border-t pt-4 {contentClass}">
                {@render children()}
            </Card.Content>
        </div>
    </div>
</Card.Root>
