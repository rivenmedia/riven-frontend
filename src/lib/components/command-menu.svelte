<script lang="ts">
    import * as Command from '$lib/components/ui/command/index.js';
    import { getContext } from 'svelte';
    import Search from '@lucide/svelte/icons/search';

    let commandState: any = getContext('commandState');

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commandState.open = !commandState.open;
        }
    }

    let value = $state('');
    let search = $state('');

    function searchTMDB(e: Event) {
        console.log('searchTMDB', e);
    }
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog
    bind:open={commandState.open}
    bind:value={() => value, (newValue) => (value = newValue)}
>
    <Command.Input bind:value={search} onkeydown={searchTMDB} placeholder="Type a command or search..." />
    <Command.List>
        {#if search.length}
            <p class="text-sm text-muted-foreground">
                Results for <strong>{search}</strong>
            </p>
        {/if}
    </Command.List>
</Command.Dialog>
