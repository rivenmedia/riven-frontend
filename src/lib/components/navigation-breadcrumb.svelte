<script lang="ts">
	import { ChevronRight, Library } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';

	export interface BreadcrumbItem {
		label: string;
		href: string;
		isActive?: boolean;
		dropdown?: DropdownItem[];
	}

	export interface DropdownItem {
		label: string;
		href: string;
		isActive?: boolean;
		badge?: string;
	}

	export let items: BreadcrumbItem[] = [];
	export let className: string = '';
</script>

<nav
	aria-label="Breadcrumb"
	class={cn('flex items-center space-x-1 text-sm text-zinc-400', className)}
>
	{#each items as item, index}
		{#if index > 0}
			<ChevronRight class="h-4 w-4 flex-shrink-0" />
		{/if}

		{#if item.dropdown && item.dropdown.length > 0}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="group flex items-center gap-1 hover:text-zinc-100">
					{#if index === 0}
						<Library class="h-4 w-4" />
					{/if}
					<span
						class={cn(
							'transition-colors',
							item.isActive ? 'text-zinc-100 font-medium' : 'hover:text-zinc-100'
						)}
					>
						{item.label}
					</span>
					<ChevronRight class="h-3 w-3 rotate-90 transition-transform group-data-[state=open]:rotate-[270deg]" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" class="max-h-[400px] overflow-y-auto">
					{#each item.dropdown as dropdownItem}
						<DropdownMenu.Item asChild>
							<a
								href={dropdownItem.href}
								class={cn(
									'flex items-center justify-between gap-2',
									dropdownItem.isActive && 'bg-zinc-800'
								)}
							>
								<span>{dropdownItem.label}</span>
								{#if dropdownItem.badge}
									<span class="text-xs text-zinc-500">{dropdownItem.badge}</span>
								{/if}
							</a>
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}
			<a
				href={item.href}
				class={cn(
					'flex items-center gap-1 transition-colors',
					item.isActive ? 'text-zinc-100 font-medium' : 'hover:text-zinc-100'
				)}
			>
				{#if index === 0}
					<Library class="h-4 w-4" />
				{/if}
				<span>{item.label}</span>
			</a>
		{/if}
	{/each}
</nav> 