<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { passwordChangeSchema, type PasswordChangeSchema } from "$lib/schemas/auth";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import { Switch } from "$lib/components/ui/switch/index.js";
    import { toast } from "svelte-sonner";
    import type { FsSuperForm } from "formsnap";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { page } from "$app/state";
    import FormBase from "./form-base.svelte";

    let {
        data
    }: {
        data: SuperValidated<PasswordChangeSchema>;
    } = $props();

    const form = superForm(data, {
        validators: zod4Client(passwordChangeSchema)
    });

    const { form: formData, enhance, message, delayed } = form;

    const passwordVisibility = $state({
        oldPassword: false,
        newPassword: false,
        confirmNewPassword: false
    });

    type PasswordFieldName = "oldPassword" | "newPassword" | "confirmNewPassword";

    function togglePasswordVisibility(field: keyof typeof passwordVisibility) {
        passwordVisibility[field] = !passwordVisibility[field];
    }

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

{#snippet passwordFormField(
    form: FsSuperForm<PasswordChangeSchema>,
    name: PasswordFieldName,
    title: string
)}
    <Form.Field {form} {name}>
        <Form.Control>
            {#snippet children({ props })}
                <Form.Label>{title}</Form.Label>
                <ButtonGroup.Root class="w-full">
                    <Input
                        type={passwordVisibility[name] ? "text" : "password"}
                        {...props}
                        bind:value={$formData[name]} />
                    <Button
                        onclick={() => togglePasswordVisibility(name)}
                        variant="outline"
                        size="icon"
                        aria-label="toggle password visibility">
                        {#if passwordVisibility[name]}
                            <EyeOff />
                        {:else}
                            <Eye />
                        {/if}
                    </Button>
                </ButtonGroup.Root>
            {/snippet}
        </Form.Control>
        <Form.FieldErrors />
    </Form.Field>
{/snippet}

<FormBase
    title="Change Password"
    description="Update your account password to keep your account secure.">
    {#snippet content()}
        <form method="POST" use:enhance action="?/passwordChange">
            {@render passwordFormField(form, "oldPassword", "Current Password")}
            {@render passwordFormField(form, "newPassword", "New Password")}
            {@render passwordFormField(form, "confirmNewPassword", "Confirm New Password")}

            <Form.Field {form} name="revokeSessions" class="mt-4">
                <Form.Control>
                    {#snippet children({ props })}
                        <div class="flex items-center gap-2">
                            <Switch {...props} bind:checked={$formData.revokeSessions} />
                            <Form.Label for="revokeSessions">Revoke all other sessions</Form.Label>
                        </div>
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
            Change Password
        </Form.Button>
    {/snippet}
</FormBase>
