<script lang="ts">
    import * as Form from "$lib/components/ui/form/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { setPasswordSchema, type SetPasswordSchema } from "$lib/schemas/auth";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import SuperDebug from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import type { FsSuperForm } from "formsnap";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import FormBase from "./form-base.svelte";

    let {
        data
    }: {
        data: SuperValidated<SetPasswordSchema>;
    } = $props();

    const form = superForm(data, {
        validators: zod4Client(setPasswordSchema)
    });

    const { form: formData, enhance, message, delayed } = form;

    const passwordVisibility = $state({
        newPassword: false,
        confirmNewPassword: false
    });

    type PasswordFieldName = "newPassword" | "confirmNewPassword";

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

{#snippet passwordFormField(form: FsSuperForm<SetPasswordSchema>, name: PasswordFieldName, title: string)}
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
    title="Set Password"
    description="Update your user profile information including username, name, and avatar.">
    {#snippet content()}
        <form method="POST" use:enhance action="?/setPassword">
            {@render passwordFormField(form, "newPassword", "New Password")}
            {@render passwordFormField(form, "confirmNewPassword", "Confirm New Password")}
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
            Set Password
        </Form.Button>
    {/snippet}
</FormBase>
