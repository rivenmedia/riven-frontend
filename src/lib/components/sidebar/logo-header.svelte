<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Mountain from '@lucide/svelte/icons/mountain';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton size="lg">
			<div
				class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
			>
				<Mountain class="size-4" />
			</div>
			<div class="grid flex-1 text-left text-sm leading-tight">
				<span class="truncate font-medium"> Riven </span>
				<span class="truncate text-xs">Media Management</span>
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
