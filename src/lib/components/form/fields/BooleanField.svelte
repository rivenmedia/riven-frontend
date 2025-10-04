<script lang="ts">
    import { type SuperForm, formFieldProxy } from "sveltekit-superforms";
    import * as Form from "$lib/components/ui/form/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";

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
                <div class="flex items-center gap-2">
                    <Checkbox {...props} {...constraints} bind:checked={$value} />
                    <Form.Label class="!mt-0">
                        {label}
                        {#if !isOptional}
                            <span class="text-red-500">*</span>
                        {/if}
                    </Form.Label>
                </div>
                {#if description}
                    <Form.Description>{description}</Form.Description>
                {/if}
            {/snippet}
        </Form.Control>
        <Form.FieldErrors />
    {/snippet}
</Form.Field>
