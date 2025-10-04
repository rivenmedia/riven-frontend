<script lang="ts">
    import { type SuperForm, formFieldProxy } from "sveltekit-superforms";
    import { z } from "zod";
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Form from "$lib/components/ui/form/index.js";

    interface Props {
        path: string;
        form: SuperForm<any>;
        label: string;
        isOptional: boolean;
        schema: z.ZodEnum<any> | z.ZodNativeEnum<any>;
        description?: string;
    }

    let { path, form, label, isOptional, schema, description }: Props = $props();

    const { value } = formFieldProxy(form, path);

    // Get enum values
    const options = $derived(() => {
        if (schema instanceof z.ZodEnum) {
            return schema.options;
        } else if (schema instanceof z.ZodNativeEnum) {
            return Object.values(schema.enum);
        }
        return [];
    });
</script>

<Form.Field {form} name={path}>
    {#snippet children({ constraints })}
        <Form.Control>
            {#snippet children({ props })}
                <Form.Label>
                    {label}
                    {#if !isOptional}
                        <span class="text-red-500">*</span>
                    {/if}
                </Form.Label>
                {#if description}
                    <Form.Description>{description}</Form.Description>
                {/if}
                <Select.Root type="single" bind:value={$value} name={props.name}>
                    <Select.Trigger class="w-full" {...props}>
                        {$value || `Select ${label.toLowerCase()}`}
                    </Select.Trigger>
                    <Select.Content>
                        {#each options() as option}
                            <Select.Item value={option}>{option}</Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            {/snippet}
        </Form.Control>
        <Form.FieldErrors />
    {/snippet}
</Form.Field>
