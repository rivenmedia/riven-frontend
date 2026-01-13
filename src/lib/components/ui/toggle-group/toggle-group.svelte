<script lang="ts" module>
	import { getContext, setContext } from "svelte";
	import type { ToggleVariants } from "$lib/components/ui/toggle/index.js";

	export function getToggleGroupCtx() {
		return getContext<ToggleVariants>("toggleGroup");
	}
</script>

<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: ToggleGroupPrimitive.RootProps & ToggleVariants = $props();

	// Create reactive context - must be set synchronously during init
	const ctx: ToggleVariants = $state({ variant: "default", size: "default" });
	setContext("toggleGroup", ctx);

	// Keep context in sync with props (pre runs before render)
	$effect.pre(() => {
		ctx.variant = variant;
		ctx.size = size;
	});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<ToggleGroupPrimitive.Root
	bind:value={value as never}
	bind:ref
	data-slot="toggle-group"
	data-variant={variant}
	data-size={size}
	class={cn(
		"group/toggle-group data-[variant=outline]:shadow-xs flex w-fit items-center rounded-md",
		className
	)}
	{...restProps}
/>
