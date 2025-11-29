<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="data-[state=closed]:animate-accordion-collapse data-[state=open]:animate-accordion-expand overflow-hidden text-sm"
	{...restProps}
>
	<div class={cn("pb-4 pt-0", className)}>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
