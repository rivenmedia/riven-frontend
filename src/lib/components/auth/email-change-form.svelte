<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { emailChangeSchema, type EmailChangeSchema } from "$lib/schemas/auth";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import SuperDebug from "sveltekit-superforms";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { dev } from "$app/environment";
    import { handleFormMessage } from "$lib/utils";

    let {
        data
    }: {
        data: SuperValidated<EmailChangeSchema>;
    } = $props();

    const form = superForm(data, {
        validators: zod4Client(emailChangeSchema)
    });

    const { form: formData, enhance, message, delayed } = form;

    $effect(() => {
        handleFormMessage($message);
    });
</script>

<div class="flex flex-col">
    {#if dev}
        <!-- <SuperDebug data={formData} /> -->
    {/if}
    <h2 class="text-lg font-semibold">Change Email</h2>
    <form class="mt-4" method="POST" use:enhance action="?/usernameChange">
        <Form.Field {form} name="newEmail">
            <Form.Control>
                {#snippet children({ props })}
                    <Form.Label for="newEmail">New Email</Form.Label>
                    <Input
                        type="email"
                        placeholder="Your new email address"
                        {...props}
                        bind:value={$formData.newEmail} />
                {/snippet}
            </Form.Control>
            <Form.FieldErrors />
        </Form.Field>

        <Form.Button class="mt-2" variant="secondary" size="sm" disabled={$delayed}>
            {#if $delayed}
                <LoaderCircle class="mr-2 h-5 w-5 animate-spin" />
            {/if}
            Change Email
        </Form.Button>
    </form>
</div>
