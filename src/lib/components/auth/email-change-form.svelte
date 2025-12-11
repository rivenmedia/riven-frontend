<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { emailChangeSchema, type EmailChangeSchema } from "$lib/schemas/auth";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toast } from "svelte-sonner";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { page } from "$app/state";
    import FormBase from "./form-base.svelte";

    let {
        data
    }: {
        data: SuperValidated<EmailChangeSchema>;
    } = $props();

    // svelte-ignore state_referenced_locally
    const form = superForm(data, {
        validators: zod4Client(emailChangeSchema)
    });

    const { form: formData, enhance, message, delayed } = form;

    $effect(() => {
        if ($message) {
            if (page.status >= 200 && page.status < 300) {
                toast.success($message);
            } else {
                toast.error($message);
            }
        }
    });
</script>

<FormBase
    title="Change Email"
    description="Manage your email address associated with your account.">
    {#snippet content()}
        <form method="POST" use:enhance action="?/emailChange">
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
        </form>
    {/snippet}

    {#snippet footer()}
        <Form.Button
            variant="secondary"
            size="sm"
            disabled={$delayed}
            onclick={() => {
                form.submit();
            }}>
            {#if $delayed}
                <LoaderCircle class="mr-2 h-5 w-5 animate-spin" />
            {/if}
            Change Email
        </Form.Button>
    {/snippet}
</FormBase>
