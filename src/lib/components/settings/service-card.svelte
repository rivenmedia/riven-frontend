<script lang="ts">
    import CollapsibleCard from "./collapsible-card.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        description?: string;
        enabled: boolean;
        onToggle: (enabled: boolean) => void;
        children: Snippet;
    }

    let { title, description, enabled, onToggle, children }: Props = $props();
</script>

<CollapsibleCard {title} {description} hasToggle {enabled} {onToggle}>
    {@render children()}
</CollapsibleCard>
