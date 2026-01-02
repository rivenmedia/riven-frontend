<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils";
	import { mediaProgressStore } from "$lib/stores/media-progress.svelte";
	import { invalidateAll } from "$app/navigation";

	interface Props {
		itemId: number | undefined;
		currentState: string | undefined;
		externalId?: string;
		externalIdType?: "imdb" | "tmdb" | "tvdb";
		class?: string;
	}

	let { itemId, currentState, externalId, externalIdType, class: className }: Props = $props();

	// Track if we've already invalidated for this completion
	let hasInvalidatedForCompletion = $state(false);

	// Reactive state - prefer live state from store
	// Access SvelteMap directly for reactivity
	// Try internal ID first, then external ID, finally fallback to currentState
	let state = $derived.by(() => {
		const { itemStates, externalIdMap } = mediaProgressStore;

		if (itemId) {
			const liveState = itemStates.get(itemId);
			if (liveState) return liveState;
		}
		if (externalId && externalIdType) {
			const key = `${externalIdType}:${externalId}`;
			const internalId = externalIdMap.get(key);
			const liveState = internalId ? itemStates.get(internalId) : undefined;
			if (liveState) return liveState;
		}
		return currentState;
	});

	let activeServices = $derived.by(() => {
		const { activeServices: services, externalIdMap } = mediaProgressStore;

		if (itemId) {
			return services.get(itemId) || [];
		}
		if (externalId && externalIdType) {
			const key = `${externalIdType}:${externalId}`;
			const internalId = externalIdMap.get(key);
			return internalId ? (services.get(internalId) || []) : [];
		}
		return [];
	});

	let isProcessing = $derived(activeServices.length > 0);

	let badgeClass = $derived(
		cn(
			"mb-2 transition-colors",
			isProcessing && "animate-pulse",
			state === "Completed"
				? "bg-green-600"
				: state === "Unknown"
					? "bg-red-600"
					: "bg-yellow-600",
			className
		)
	);

	let displayText = $derived(
		isProcessing ? `${state} (${activeServices[0]}...)` : state || "Unknown"
	);

	// When state changes to Completed, refresh page data to show action buttons
	$effect(() => {
		if (state === "Completed" && currentState !== "Completed" && !hasInvalidatedForCompletion) {
			hasInvalidatedForCompletion = true;
			invalidateAll();
		}
	});
</script>

{#if state}
	<Badge class={badgeClass}>
		{#if isProcessing}
			<span class="mr-1">●</span>
		{/if}
		{displayText}
	</Badge>
{/if}
