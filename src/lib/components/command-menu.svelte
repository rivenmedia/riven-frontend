<script lang="ts">
    import * as Command from '$lib/components/ui/command/index.js';
    import { getContext } from 'svelte';
    import { navItems } from '$lib/constants';
    import Search from '@lucide/svelte/icons/search';

    let commandState: any = getContext('commandState');

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commandState.open = !commandState.open;
        }
    }

    let value = $state('');
</script>

<svelte:document onkeydown={handleKeydown} />

<Command.Dialog
    bind:open={commandState.open}
    bind:value={() => value, (newValue) => (value = newValue)}
    shouldFilter={false}
>
    <Command.Input placeholder="Type a command or search..." />
    <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        {#if value.length}
            <Command.Group heading="Search TMDB">
                <Command.Item>
                    <Search class="mr-2 size-4" />
                    <span>Search for "{value}"</span>
                </Command.Item>
            </Command.Group>
        {/if}

        <Command.Group heading="Navigations">
            {#each navItems as item}
                {#if item.href}
                    <Command.LinkItem href={item.href}>
                        <item.icon class="mr-2 size-4" />
                        <span>{item.name}</span>
                    </Command.LinkItem>
                {/if}
            {/each}
        </Command.Group>
    </Command.List>
</Command.Dialog>
