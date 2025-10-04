<script lang="ts">
    import { type SuperForm, formFieldProxy } from "sveltekit-superforms";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as Form from "$lib/components/ui/form/index.js";

    interface Props {
        path: string;
        form: SuperForm<any>;
        label: string;
        isOptional: boolean;
        description?: string;
    }

    let { path, form, label, isOptional, description }: Props = $props();

    const { value } = formFieldProxy(form, path);
</script>

<Form.Field {form} name={path}>
    {#snippet children({ constraints, errors })}
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
                <Input type="number" {...props} {...constraints} bind:value={$value} />
            {/snippet}
        </Form.Control>
        <Form.FieldErrors />
    {/snippet}
</Form.Field>
