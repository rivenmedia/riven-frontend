<script lang="ts">
    import { type SuperForm } from "sveltekit-superforms";
    import { type ZodObject } from "zod";
    import FormGenerator from "../FormGenerator.svelte";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import ChevronUp from "@lucide/svelte/icons/chevron-up";
    import { slide } from "svelte/transition";

    interface Props {
        path: string;
        form: SuperForm<any>;
        label: string;
        isOptional: boolean;
        schema: ZodObject<any>;
        description?: string;
    }

    let { path, form, label, isOptional, schema, description }: Props = $props();

    // Calculate nesting depth by counting dots in path
    const depth = path.split('.').length - 1;
    console.log(`Rendering ObjectField for path "${path}" at depth ${depth}`);
    const useCard = depth < 3; // Use cards for depth 0 and 1, accordions for depth 2+

    let expanded = $state(false);
</script>

{#if useCard}
    <Card.Root class="p-2">
        <Card.Header class="cursor-pointer py-2" onclick={() => (expanded = !expanded)}>
            <div class="flex w-full items-center justify-between">
                <Card.Title class="text-lg">
                    {label}
                    {#if !isOptional}
                        <span class="text-red-500">*</span>
                    {/if}
                </Card.Title>
                <div class="transition-transform duration-200">
                    {#if expanded}
                        <ChevronUp size={20} />
                    {:else}
                        <ChevronDown size={20} />
                    {/if}
                </div>
            </div>
            {#if description}
                <Card.Description>{description}</Card.Description>
            {/if}
        </Card.Header>
        {#if expanded}
            <div transition:slide>
                <Card.Content>
                    <FormGenerator {schema} {form} {path} />
                </Card.Content>
            </div>
        {/if}
    </Card.Root>
{:else}
    <Accordion.Root type="single" class="w-full border-l rounded-md ml-4">
        <Accordion.Item value="item-1">
            <Accordion.Trigger class="text-left px-4">
                <div class="flex flex-col items-start gap-1">
                    <div class="text-base font-medium">
                        {label}
                        {#if !isOptional}
                            <span class="text-red-500">*</span>
                        {/if}
                    </div>
                    {#if description}
                        <div class="text-sm text-muted-foreground font-normal">
                            {description}
                        </div>
                    {/if}
                </div>
            </Accordion.Trigger>
            <Accordion.Content>
                <div class="pt-2 pb-4 px-4">
                    <FormGenerator {schema} {form} {path} />
                </div>
            </Accordion.Content>
        </Accordion.Item>
    </Accordion.Root>
{/if}
