<script lang="ts">
	import Mountain from '@lucide/svelte/icons/mountain';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { loginSchema, registerSchema } from '$lib/schemas/auth';
	import SuperDebug from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';

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

	let activeTab = $state('login');
</script>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href="/" class="flex items-center gap-2 font-medium">
				<div
					class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
				>
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
							<Card.Description>Enter your username below to login to your account</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<form method="POST" use:loginEnhance action="?/login">
								<Form.Field form={loginForm} name="username">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Username</Form.Label>
											<Input {...props} bind:value={$loginFormData.username} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field form={loginForm} name="password">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Password</Form.Label>
											<Input {...props} type="password" bind:value={$loginFormData.password} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Button class="mt-4">Submit</Form.Button>
							</form>
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
							<Card.Description>Enter your details below to create a new account</Card.Description>
						</Card.Header>
						<Card.Content>
							<form method="POST" use:registerEnhance action="?/register">
								<Form.Field form={registerForm} name="username">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Username</Form.Label>
											<Input {...props} bind:value={$registerFormData.username} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<Form.Field form={registerForm} name="password">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Password</Form.Label>
											<Input {...props} type="password" bind:value={$registerFormData.password} />
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
												bind:value={$registerFormData.confirmPassword}
											/>
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
			src="/placeholder.svg"
			alt="placeholder"
			class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
		/>
	</div>
</div>
