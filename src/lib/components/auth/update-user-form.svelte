<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { changeUserDataSchema, type ChangeUserDataSchema } from "$lib/schemas/auth";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toast } from "svelte-sonner";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import FormBase from "./form-base.svelte";

    let {
        data
    }: {
        data: SuperValidated<ChangeUserDataSchema>;
    } = $props();

    const form = superForm(data, {
        validators: zod4Client(changeUserDataSchema)
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
    title="Update Profile"
    description="Update your user profile information including username, name, and avatar.">
    {#snippet content()}
        <form method="POST" use:enhance action="?/updateUserData">
            <Form.Field {form} name="newUsername">
                <Form.Control>
                    {#snippet children({ props })}
                        <Form.Label for="newUsername">Username</Form.Label>
                        <Input
                            placeholder="Your new username"
                            {...props}
                            bind:value={$formData.newUsername} />
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="newName">
                <Form.Control>
                    {#snippet children({ props })}
                        <Form.Label for="newName">Name</Form.Label>
                        <Input
                            placeholder="Your new name"
                            {...props}
                            bind:value={$formData.newName} />
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <Form.Field {form} name="newAvatar">
                <Form.Control>
                    {#snippet children({ props })}
                        <Form.Label for="newAvatar">Avatar</Form.Label>
                        <Input
                            placeholder="Your new avatar URL"
                            {...props}
                            bind:value={$formData.newAvatar} />
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
            Update profile
        </Form.Button>
    {/snippet}
</FormBase>
