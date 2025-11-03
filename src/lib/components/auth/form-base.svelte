<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import type { Snippet } from "svelte";
    import { cn } from "$lib/utils";
    import { Separator } from "$lib/components/ui/separator/index.js";

    interface Props {
        title: string;
        description?: string;
        class?: string;
        content: Snippet;
        footer?: Snippet;
    }

    let {
        title,
        description = undefined,
        class: className = "",
        content,
        footer
    }: Props = $props();
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>
            {title}
        </Card.Title>
        {#if description}
            <Card.Description>{description}</Card.Description>
        {/if}
    </Card.Header>
    <div class={cn("flex h-full flex-col justify-between", className)}>
        <Card.Content>
            {@render content?.()}
        </Card.Content>
        <div>
            <Separator class="my-4" />
            <Card.Footer>
                {@render footer?.()}
            </Card.Footer>
        </div>
    </div>
</Card.Root>
