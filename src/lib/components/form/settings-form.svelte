<script lang="ts">
    import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zAppModel, type AppModelZodType } from "$lib/api/zod.gen";
    import { zodClient } from "sveltekit-superforms/adapters";
    import SuperDebug from "sveltekit-superforms/SuperDebug.svelte";
    import { dev } from "$app/environment";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Form from "$lib/components/ui/form/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { flattenObject } from "$lib/helpers";

    import { toast } from "svelte-sonner";
    import { page } from "$app/state";

    let { data }: { data: { form: SuperValidated<AppModelZodType> } } = $props();
    $inspect(data);

    const form = superForm(data.form, {
        dataType: "json",
        validators: zodClient(zAppModel)
    });

    const { form: formData, enhance, errors, message } = form;

    $effect(() => {
        $inspect.trace();
        if ($message && page.status === 200) {
            toast.success($message);
        }
    });

    const flattenedSettings = flattenObject($formData);

</script>

<div class="h-full w-full p-6 md:p-8 md:px-16">
    <h1 class="mb-8 text-3xl font-bold tracking-tight">Backend Settings</h1>

    <form method="POST" use:enhance>
        <!-- {#each Object.entries($formData) as [key, value]}
            {#if typeof value === "string"}
                <Form.Field {form} name={key}>
                    <Form.Control>
                        {#snippet children({ props })}
                            <Form.Label>{key}</Form.Label>
                            <Input {...props} bind:value={$formData[key]} />
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            {/if}
        {/each} -->

        {#each Object.entries(flattenedSettings) as [key, value]}
            <Form.Field {form} name={key}>
                <Form.Control>
                    {#snippet children({ props })}
                        <Form.Label class="capitalize">{key.replace(/_/g, " ")}</Form.Label>
                        <Input {...props} bind:value={flattenedSettings[key]} />
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>
        {/each}
    </form>

    {#if dev}
        <SuperDebug
            display={true}
            label="Backend Settings Debug"
            data={$formData}
            collapsible
            collapsed
            theme="vscode" />
    {/if}
</div>
