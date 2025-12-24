<script lang="ts">
    import type { PageProps } from "./$types";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button/index.js";
    import Passkeys from "$lib/components/auth/passkeys.svelte";
    import PasswordChangeForm from "$lib/components/auth/password-change-form.svelte";
    import EmailChangeForm from "$lib/components/auth/email-change-form.svelte";
    import SetPasswordForm from "$lib/components/auth/set-password-form.svelte";
    import AccountLinks from "$lib/components/auth/account-links.svelte";
    import UpdateUserForm from "$lib/components/auth/update-user-form.svelte";
    import * as dateUtils from "$lib/utils/date";

    let { data }: PageProps = $props();

    function hasCredentialProvider(providers: any[]): boolean {
        return providers.some((provider) => provider.providerId === "credential");
    }
</script>

<svelte:head>
    <title>Profile - Riven</title>
</svelte:head>

<div class="mt-14 flex flex-col p-6 md:p-8 md:px-16">
    <h1 class="text-3xl font-bold tracking-tight">{data.user.name}'s Profile</h1>

    <div class="mt-4 flex flex-col gap-4">
        <div class="flex flex-row items-center gap-4">
            <img
                src={data.user.image || "https://i.pravatar.cc/200"}
                alt={data.user.name}
                class="h-16 w-16 rounded-full object-cover" />
            <div>
                <p class="text-lg font-semibold">{data.user.name}</p>
                <p class="text-muted-foreground text-sm">{data.user.email}</p>
            </div>
        </div>

        <div class="flex flex-col">
            <p class="text-muted-foreground text-sm">
                Member since {dateUtils.formatDate(data.user.createdAt)}
            </p>

            <p class="text-muted-foreground text-sm">
                Last updated {dateUtils.formatDate(data.user.updatedAt)}
            </p>

            <p class="text-muted-foreground text-sm">
                Session expires at {dateUtils.formatDate(data.session.expiresAt)}
            </p>
        </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#if hasCredentialProvider(data.accounts)}
            <PasswordChangeForm data={data.passwordChangeForm} />
        {:else}
            <SetPasswordForm data={data.setPasswordForm} />
        {/if}
        <EmailChangeForm data={data.emailChangeForm} />

        <UpdateUserForm data={data.changeUserDataForm} />
    </div>

    <div class="mt-8">
        <AccountLinks accounts={data.accounts} providers={data.authProviders} />
    </div>

    <div class="mt-8">
        <Passkeys />
    </div>

    <div class="mt-4 flex flex-col gap-2 md:flex-row">
        <Button
            variant="secondary"
            class="w-full md:max-w-max"
            onclick={async () => {
                await authClient.deleteUser({
                    fetchOptions: {
                        onSuccess: () => {
                            goto("/auth/login");
                        }
                    }
                });
            }}>
            Delete Account
        </Button>

        <Button
            variant="destructive"
            class="w-full md:max-w-max"
            onclick={async () => {
                await authClient.signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            goto("/auth/login");
                        }
                    }
                });
            }}>
            Logout
        </Button>
    </div>
</div>
