<script lang="ts">
    import * as Tooltip from '$lib/components/ui/tooltip/index.js';
    import type { Snippet } from 'svelte';

    let {
        trigger,
        content,
        class: className = '',
        ...restProps
    }: {
        trigger: Snippet;
        content: Snippet;
        class?: string;
    } = $props();
</script>

<Tooltip.Provider>
    <Tooltip.Root>
        <Tooltip.Trigger class={className} {...restProps}>
            {@render trigger()}
        </Tooltip.Trigger>
        <Tooltip.Content>
            {@render content()}
        </Tooltip.Content>
    </Tooltip.Root>
</Tooltip.Provider>