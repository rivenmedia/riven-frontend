<script lang="ts">
    import { type SuperForm, formFieldProxy } from "sveltekit-superforms";
    import { type ZodArray } from "zod";
    import * as Form from "$lib/components/ui/form/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import X from "@lucide/svelte/icons/x";
    import { Input } from "$lib/components/ui/input/index.js";

    interface Props {
        path: string;
        form: SuperForm<any>;
        label: string;
        isOptional: boolean;
        schema: ZodArray<any>;
        description?: string;
    }

    let { path, form, label, isOptional, schema, description }: Props = $props();

    const { value } = formFieldProxy(form, path);

    // Ensure value is initialized as an array
    $effect(() => {
        if ($value === undefined || $value === null) {
            $value = [];
        }
    });

    let items = $derived(Array.isArray($value) ? $value : []);

    function addItem() {
        $value = [...items, ""];
    }

    function removeItem(index: number) {
        $value = items.filter((_: any, i: number) => i !== index);
    }
</script>

<Form.Fieldset {form} name={path}>
    <Form.Legend>
        {label}
        {#if !isOptional}
            <span class="text-red-500">*</span>
        {/if}
    </Form.Legend>
    {#if description}
        <Form.Description>{description}</Form.Description>
    {/if}

    {#each items as item, i}
        <Form.ElementField {form} name={`${path}[${i}]`}>
            <Form.Control>
                {#snippet children({ props })}
                    <div class="flex items-center space-x-2">
                        <Form.Label class="sr-only">{label} {i + 1}</Form.Label>
                        <Input type="text" class="flex-1" bind:value={$value[i]} {...props} />

                        <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            onclick={() => removeItem(i)}>
                            <X class="size-4" />
                        </Button>
                    </div>
                {/snippet}
            </Form.Control>
            <Form.FieldErrors />
        </Form.ElementField>
    {/each}

    {#if items.length === 0}
        <p class="text-muted-foreground text-sm">No items added</p>
    {/if}

    <Form.FieldErrors />

    <Button variant="outline" size="sm" class="mt-2" onclick={addItem}>Add Item</Button>
</Form.Fieldset>
