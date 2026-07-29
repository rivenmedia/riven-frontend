<script lang="ts">
    import type { PageProps } from "./$types";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Passkeys from "$lib/components/auth/passkeys.svelte";
    import PasswordChangeForm from "$lib/components/auth/password-change-form.svelte";
    import EmailChangeForm from "$lib/components/auth/email-change-form.svelte";
    import SetPasswordForm from "$lib/components/auth/set-password-form.svelte";
    import AccountLinks from "$lib/components/auth/account-links.svelte";
    import UpdateUserForm from "$lib/components/auth/update-user-form.svelte";
    import UserManagement from "$lib/components/auth/user-management.svelte";
    import * as dateUtils from "$lib/utils/date";
    import { getInitials } from "$lib/utils";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import PageShell from "$lib/components/page-shell.svelte";

    let { data }: PageProps = $props();

    function hasCredentialProvider(providers: { providerId?: string | null }[]): boolean {
        return providers.some((provider) => provider.providerId === "credential");
    }
</script>

<svelte:head>
    <title>Profile - Riven</title>
</svelte:head>

<PageShell class="mx-auto w-full max-w-5xl">
    <section
        class="border-border/60 flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex items-start gap-4">
            <Avatar.Root class="h-16 w-16 text-xl">
                {#if data.user.image}
                    <Avatar.Image src={data.user.image} alt={data.user.name} />
                {/if}
                <Avatar.Fallback class="bg-primary text-primary-foreground font-semibold">
                    {getInitials(data.user.name)}
                </Avatar.Fallback>
            </Avatar.Root>

            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <h1 class="text-3xl font-bold tracking-tight">{data.user.name}'s Profile</h1>
                    <Badge variant="secondary" class="capitalize"
                        >Role: {data.permissions.role}</Badge>
                </div>
                <p class="text-muted-foreground mt-1 text-sm break-all">{data.user.email}</p>

                <dl class="text-muted-foreground mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div class="flex gap-2">
                        <dt>Member since</dt>
                        <dd class="text-foreground">
                            {dateUtils.formatDate(data.user.createdAt)}
                        </dd>
                    </div>
                    <div class="flex gap-2">
                        <dt>Last updated</dt>
                        <dd class="text-foreground">
                            {dateUtils.formatDate(data.user.updatedAt)}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
            <Button
                variant="secondary"
                class="w-full sm:w-auto"
                onclick={async () => {
                    await authClient.signOut({
                        fetchOptions: {
                            onSuccess: () => {
                                goto(resolve("/auth/login"));
                            }
                        }
                    });
                }}>
                Logout
            </Button>

            <Button
                variant="destructive"
                class="w-full sm:w-auto"
                onclick={async () => {
                    await authClient.deleteUser({
                        fetchOptions: {
                            onSuccess: () => {
                                goto(resolve("/auth/login"));
                            }
                        }
                    });
                }}>
                Delete Account
            </Button>
        </div>
    </section>

    <div>
        {#if hasCredentialProvider(data.accounts)}
            <PasswordChangeForm data={data.passwordChangeForm} />
        {:else}
            <SetPasswordForm data={data.setPasswordForm} />
        {/if}
        <EmailChangeForm data={data.emailChangeForm} />

        <UpdateUserForm data={data.changeUserDataForm} />
    </div>

    {#if data.permissions.canManageSettings}
        <UserManagement
            formData={data.createUserForm}
            users={data.managedUsers}
            currentUserId={data.user.id} />
    {/if}

    <AccountLinks accounts={data.accounts} providers={data.authProviders} />
    <Passkeys />
</PageShell>
