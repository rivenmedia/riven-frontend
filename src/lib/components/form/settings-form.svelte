<script lang="ts">
    import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zAppModel, type AppModelZodType } from "$lib/api/zod.gen";
    import { zodClient } from "sveltekit-superforms/adapters";
    import SuperDebug from "sveltekit-superforms/SuperDebug.svelte";
    import { dev } from "$app/environment";
    import FormGenerator from "$lib/components/form/FormGenerator.svelte";
    import { Button } from "$lib/components/ui/button/index.js";

    let { data }: { data: { form: SuperValidated<AppModelZodType> } } = $props();
    $inspect(data);

    const form = superForm(data.form, {
        dataType: "json",
        validators: zodClient(zAppModel),
        onUpdated({ form }) {
            if (form.valid) {
                // Handle successful update
                console.log("Form is valid!");
            }
        }
    });

    const { form: formData, enhance, errors } = form;
</script>

<div class="h-full w-full p-6 md:p-8 md:px-16">
    <h1 class="mb-8 text-3xl font-bold tracking-tight">Backend Settings</h1>

    <form method="POST" use:enhance class="max-w-4xl space-y-8">
        <FormGenerator schema={zAppModel} {form} />

        <div class="flex justify-end">
            <Button type="submit" class="px-6 py-2">Save Settings</Button>
        </div>
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
