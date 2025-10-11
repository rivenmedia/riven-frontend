<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Form from "$lib/components/ui/form/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
    import { zodClient } from "sveltekit-superforms/adapters";
    import { loginSchema, registerSchema } from "$lib/schemas/auth";
    import SuperDebug from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    let {
        data
    }: {
        data: {
            loginForm: SuperValidated<Infer<typeof loginSchema>>;
            registerForm: SuperValidated<Infer<typeof registerSchema>>;
        };
    } = $props();

    const loginForm = superForm(data.loginForm, {
        validators: zodClient(loginSchema),
        resetForm: true
    });

    const registerForm = superForm(data.registerForm, {
        validators: zodClient(registerSchema),
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
            toast.error($loginMessage);
        }

        if ($registerMessage) {
            toast.error($registerMessage);
        }
    });

    onMount(() => {
        const error = $page.url.searchParams.get("error");
        if (error) {
            toast.error(error);
        }
    });

    let activeTab = $state("login");
</script>

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
                    <div class="my-4">
                        <SuperDebug data={loginFormData} />
                    </div>
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

                            <Button
                                href="/auth/plex/login"
                                variant="outline"
                                class="w-full"
                                type="button">
                                <!-- <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 512 512"
                                    class="mr-2 h-4 w-4">
                                    <path
                                        fill="currentColor"
                                        d="M339.4 129.8L448 256L339.4 382.2C336.4 386.3 331.5 388.5 326.5 388.5H301.4L397.2 256L301.4 123.5H326.5C331.5 123.5 336.4 125.7 339.4 129.8zM246.1 123.5H271.2L175.4 256L271.2 388.5H246.1C241.1 388.5 236.2 386.3 233.2 382.2L124.6 256L233.2 129.8C236.2 125.7 241.1 123.5 246.1 123.5z" />
                                </svg> -->
                                Login with Plex
                            </Button>
                        </Card.Content>
                    </Card.Root>
                </Tabs.Content>
                <Tabs.Content value="register">
                    <div class="my-4">
                        <SuperDebug data={registerFormData} />
                    </div>
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
