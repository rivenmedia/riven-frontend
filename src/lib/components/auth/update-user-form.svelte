<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { changeUserDataSchema, type ChangeUserDataSchema } from "$lib/schemas/auth";
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
        data: SuperValidated<ChangeUserDataSchema>;
    } = $props();

    const form = superForm(data, {
        validators: zod4Client(changeUserDataSchema)
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
    <h2 class="text-lg font-semibold">Change User Data</h2>
    <form class="mt-4" method="POST" use:enhance action="?/updateUserData">
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
                    <Input placeholder="Your new name" {...props} bind:value={$formData.newName} />
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

        <Form.Button class="mt-2" variant="secondary" size="sm" disabled={$delayed}>
            {#if $delayed}
                <LoaderCircle class="mr-2 h-5 w-5 animate-spin" />
            {/if}
            Change User Data
        </Form.Button>
    </form>
</div>
