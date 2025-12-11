<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Form from "$lib/components/ui/form/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { loginSchema, registerSchema } from "$lib/schemas/auth";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import Fingerprint from "@lucide/svelte/icons/fingerprint";
    import { doesBrowserSupportPasskeys } from "$lib/passkeys";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import Star from "@lucide/svelte/icons/star";

    let {
        data
    }: {
        data: {
            loginForm: SuperValidated<Infer<typeof loginSchema>>;
            registerForm: SuperValidated<Infer<typeof registerSchema>>;
            authProviders: any;
        };
    } = $props();

    // svelte-ignore state_referenced_locally
    const loginForm = superForm(data.loginForm, {
        validators: zod4Client(loginSchema),
        resetForm: true
    });

    // svelte-ignore state_referenced_locally
    const registerForm = superForm(data.registerForm, {
        validators: zod4Client(registerSchema),
        resetForm: true
    });

    const { form: loginFormData, enhance: loginEnhance, message: loginMessage } = loginForm;
    const {
        form: registerFormData,
        enhance: registerEnhance,
        message: registerMessage
    } = registerForm;

    $effect(() => {
        if ($loginMessage) {
            if (page.status >= 200 && page.status < 300) {
                toast.success($loginMessage);
            } else {
                toast.error($loginMessage);
            }
        }

        if ($registerMessage) {
            if (page.status >= 200 && page.status < 300) {
                toast.success($registerMessage);
            } else {
                toast.error($registerMessage);
            }
        }
    });

    async function plexLogin() {
        await authClient.signIn.social({
            provider: "plex"
        });
    }

    let isPasskeyLoading = $state(false);
    let supportsPasskeyAutofill = $state(false);
    let supportsPasskey = $state<boolean | undefined>(doesBrowserSupportPasskeys());

    onMount(async () => {
        if (
            doesBrowserSupportPasskeys() &&
            typeof window.PublicKeyCredential.isConditionalMediationAvailable === "function"
        ) {
            supportsPasskeyAutofill =
                await window.PublicKeyCredential.isConditionalMediationAvailable();

            if (supportsPasskeyAutofill) {
                void authClient.signIn.passkey({
                    autoFill: true,
                    fetchOptions: {
                        onSuccess() {
                            goto("/");
                        },
                        onError(context) {
                            console.debug("Passkey autofill failed:", context.error);
                        }
                    }
                });
            }
        }
    });

    async function handlePasskeySignIn() {
        isPasskeyLoading = true;
        try {
            await authClient.signIn.passkey({
                fetchOptions: {
                    onSuccess() {
                        goto("/");
                    },
                    onError(context) {
                        toast.error(context.error.message || "Passkey authentication failed");
                    }
                }
            });
        } catch (error) {
            toast.error("Passkey authentication failed");
        } finally {
            isPasskeyLoading = false;
        }
    }

    let activeTab = $state("login");
    const lastLoginMethod = authClient.getLastUsedLoginMethod();
</script>

{#snippet star()}
    <Star class="absolute top-0 -right-2 h-4 w-4 rotate-45 animate-pulse text-yellow-400" />
{/snippet}

<div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex justify-center gap-2 md:justify-start">
            <a href="/" class="flex items-center gap-2 font-medium">
                <div
                    class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                    <Mountain class="size-4" />
                </div>
                Riven Media
            </a>
        </div>
        <div class="flex flex-1 items-center justify-center">
            <Tabs.Root bind:value={activeTab} class="w-full max-w-md">
                <Tabs.List class="w-full">
                    <Tabs.Trigger value="login">Login</Tabs.Trigger>
                    <Tabs.Trigger value="register">Register</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="login">
                    <Card.Root class="mx-auto w-full">
                        <Card.Header>
                            <Card.Title class="text-2xl">Login</Card.Title>
                            <Card.Description
                                >Enter your username below to login to your account</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <form method="POST" use:loginEnhance action="?/login">
                                <Form.Field form={loginForm} name="username">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Username</Form.Label>
                                            <Input
                                                {...props}
                                                autocomplete="username webauthn"
                                                bind:value={$loginFormData.username} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>

                                <Form.Field form={loginForm} name="password">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Password</Form.Label>
                                            <Input
                                                {...props}
                                                type="password"
                                                autocomplete="current-password webauthn"
                                                bind:value={$loginFormData.password} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>
                                <Form.Button class="mt-4 w-full">Submit</Form.Button>
                            </form>

                            <div class="relative my-4">
                                <div class="absolute inset-0 flex items-center">
                                    <span class="w-full border-t"></span>
                                </div>
                                <div class="relative flex justify-center text-xs uppercase">
                                    <span class="bg-card text-muted-foreground px-2">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                {#if data.authProviders.plex.enabled}
                                    <Button
                                        onclick={plexLogin}
                                        variant={lastLoginMethod === "plex"
                                            ? "secondary"
                                            : "outline"}
                                        class="relative w-full"
                                        type="button">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 512 512">
                                            <path
                                                d="M256 70H148l108 186-108 186h108l108-186z"
                                                fill="currentColor" />
                                        </svg>
                                        Login with Plex
                                        {#if lastLoginMethod === "plex"}
                                            {@render star()}
                                        {/if}
                                    </Button>
                                {/if}
                                {#if supportsPasskey}
                                    <Button
                                        variant={lastLoginMethod === "passkey"
                                            ? "secondary"
                                            : "outline"}
                                        class="relative w-full"
                                        disabled={isPasskeyLoading}
                                        onclick={handlePasskeySignIn}
                                        type="button">
                                        <Fingerprint class="mr-2 h-4 w-4" />
                                        {isPasskeyLoading
                                            ? "Authenticating..."
                                            : "Sign in with Passkey"}

                                        {#if lastLoginMethod === "passkey"}
                                            {@render star()}
                                        {/if}
                                    </Button>
                                {/if}
                            </div>
                        </Card.Content>
                    </Card.Root>
                </Tabs.Content>
                <Tabs.Content value="register">
                    <Card.Root class="mx-auto w-full">
                        <Card.Header>
                            <Card.Title class="text-2xl">Register</Card.Title>
                            <Card.Description
                                >Enter your details below to create a new account</Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <form method="POST" use:registerEnhance action="?/register">
                                <Form.Field form={registerForm} name="username">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Username</Form.Label>
                                            <Input
                                                {...props}
                                                bind:value={$registerFormData.username} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>

                                <Form.Field form={registerForm} name="email">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Email</Form.Label>
                                            <Input
                                                {...props}
                                                type="email"
                                                bind:value={$registerFormData.email} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>

                                <Form.Field form={registerForm} name="image">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Image</Form.Label>
                                            <Input
                                                {...props}
                                                type="text"
                                                bind:value={$registerFormData.image} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>

                                <Form.Field form={registerForm} name="password">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Password</Form.Label>
                                            <Input
                                                {...props}
                                                type="password"
                                                bind:value={$registerFormData.password} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>

                                <Form.Field form={registerForm} name="confirmPassword">
                                    <Form.Control>
                                        {#snippet children({ props })}
                                            <Form.Label>Confirm Password</Form.Label>
                                            <Input
                                                {...props}
                                                type="password"
                                                bind:value={$registerFormData.confirmPassword} />
                                        {/snippet}
                                    </Form.Control>
                                    <Form.FieldErrors />
                                </Form.Field>
                                <Form.Button class="mt-4">Submit</Form.Button>
                            </form>
                        </Card.Content>
                    </Card.Root>
                </Tabs.Content>
            </Tabs.Root>
        </div>
    </div>
    <div class="bg-muted relative hidden lg:block">
        <img
            src="https://images.pexels.com/photos/114820/pexels-photo-114820.jpeg"
            alt="placeholder"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
    </div>
</div>
