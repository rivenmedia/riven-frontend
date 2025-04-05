<script lang="ts">
    import House from '@lucide/svelte/icons/house';
    import Search from '@lucide/svelte/icons/search';
    import ChartArea from '@lucide/svelte/icons/chart-area';
    import Settings from '@lucide/svelte/icons/settings';
    import { type Icon as IconType } from '@lucide/svelte';

    interface NavBarItem {
        name: string;
        icon?: typeof IconType;
        href?: string;
        children?: NavBarItem[];
    }

    const menuItems: NavBarItem[] = [
        {
            name: 'Home',
            icon: House,
            href: '/'
        },
        {
            name: 'Browse',
            icon: Search,
            href: '/browse'
        },
        {
            name: 'Stats',
            icon: ChartArea,
            href: '/stats'
        },
        {
            name: 'Settings',
            icon: Settings,
            href: '/settings'
        }
    ];
</script>

{#snippet menuitem(item: NavBarItem)}
    <a href={item.href} class="flex flex-col items-center gap-[0.125rem] px-6 py-3">
        <item.icon class="text-neutral-100 hover:text-neutral-200" />
        <span class="text-xs font-semibold text-neutral-200 hover:text-neutral-300">
            {item.name}
        </span>
    </a>
{/snippet}

<div class="absolute left-1/2 top-8 z-50 -translate-x-1/2">
    <div
        class="isolate flex w-full max-w-lg items-center rounded-l-full rounded-r-full bg-white/10 shadow-lg backdrop-blur-lg"
    >
        {#each menuItems as item, i}
            {@render menuitem(item)}
        {/each}
    </div>
</div>
