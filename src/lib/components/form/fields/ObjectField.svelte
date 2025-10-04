<script lang="ts">
    import { type SuperForm } from "sveltekit-superforms";
    import { type ZodObject } from "zod";
    import FormGenerator from "../FormGenerator.svelte";
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
    let expanded = $state(false);
</script>

<Card.Root class="p-2">
    <Card.Header class="cursor-pointer py-2" onclick={() => (expanded = !expanded)}>
        <div class="flex w-full items-center justify-between">
            <Card.Title class="case text-lg ">
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
