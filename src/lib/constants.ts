import { type Icon as IconType } from '@lucide/svelte';
import House from '@lucide/svelte/icons/house';
import ChartArea from '@lucide/svelte/icons/chart-area';
import Settings from '@lucide/svelte/icons/settings';
import Library from '@lucide/svelte/icons/library';

export interface NavBarItem {
    name: string;
    icon?: typeof IconType;
    href?: string;
    children?: NavBarItem[];
}

export const navItems: NavBarItem[] = [
    {
        name: 'Home',
        icon: House,
        href: '/'
    },
    {
        name: 'Library',
        icon: Library,
        href: '/library'
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
