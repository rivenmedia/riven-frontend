<script lang="ts">
    import { navItems, type NavBarItem } from '$lib/constants';
    import Search from '@lucide/svelte/icons/search';
    import { getContext } from 'svelte';

    let commandState: any = getContext('commandState');
</script>

{#snippet menuitem(item: NavBarItem)}
    <div class="group flex flex-col items-center gap-[0.125rem] px-4 py-2 md:px-6 md:py-3">
        <item.icon class="text-neutral-100 group-hover:text-neutral-200" />
        <span class="text-xs font-semibold text-neutral-200 group-hover:text-neutral-300">
            {item.name}
        </span>
    </div>
{/snippet}

<div class="absolute left-1/2 top-8 z-50 -translate-x-1/2">
    <div
        class="isolate flex w-full max-w-lg items-center rounded-l-full rounded-r-full bg-white/10 shadow-lg backdrop-blur-lg"
    >
        {#each navItems as item, i}
            {#if item.href}
                <a href={item.href}>
                    {@render menuitem(item)}
                </a>
            {/if}
        {/each}

        <button
            onclick={() => {
                commandState.open = !commandState.open;
            }}
        >
            {@render menuitem({
                name: 'Search',
                icon: Search
            })}
        </button>
    </div>
</div>
