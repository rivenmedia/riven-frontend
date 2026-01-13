<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Link2 from "@lucide/svelte/icons/link-2";
    import Link2Off from "@lucide/svelte/icons/link-2-off";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    interface Account {
        id: string;
        providerId: string;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        scopes: string[];
    }

    let {
        accounts,
        providers
    }: {
        accounts: Account[];
        providers: Record<
            string,
            { enabled: boolean; disableSignup: boolean; name?: string; icon?: string }
        >;
    } = $props();

    // Built-in social providers that use linkSocial()
    // Plex is now a generic OAuth provider, so it's no longer in this list
    const builtInProviders: string[] = [];

    function isGenericOAuthProvider(providerId: string): boolean {
        return !builtInProviders.includes(providerId) && providerId !== "credential";
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Account Links</Card.Title>
        <Card.Description>Manage your linked authentication providers.</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="flex flex-col gap-4">
            {#each Object.entries(providers) as [providerId, config] (providerId)}
                {#if config.enabled && providerId !== "credential"}
                    {@const providerName =
                        config.name || providerId.charAt(0).toUpperCase() + providerId.slice(1)}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            {#if config.icon}
                                <img src={config.icon} alt="{providerName} icon" class="h-4 w-4" />
                            {/if}
                            <span>{providerName}</span>
                        </div>
                        {#if accounts.find((account) => account.providerId === providerId)}
                            <Button
                                variant="destructive"
                                size="sm"
                                onclick={async () => {
                                    await authClient.unlinkAccount({
                                        providerId: providerId
                                    });
                                    toast.success(`${providerId} unlinked successfully.`);
                                    await goto("/auth", { invalidateAll: true });
                                }}>
                                <Link2Off class="mr-2 h-4 w-4" />
                                Unlink
                            </Button>
                        {:else}
                            <Button
                                size="sm"
                                onclick={async () => {
                                    if (isGenericOAuthProvider(providerId)) {
                                        // Use oauth2.link() for generic OAuth providers
                                        await authClient.oauth2.link({
                                            providerId: providerId,
                                            callbackURL: "/auth"
                                        });
                                    } else {
                                        // Use linkSocial() for built-in social providers (plex)
                                        await authClient.linkSocial({
                                            provider: providerId,
                                            callbackURL: "/auth"
                                        });
                                    }
                                    toast.success(`${providerId} linked successfully.`);
                                }}>
                                <Link2 class="mr-2 h-4 w-4" />
                                Link
                            </Button>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>
    </Card.Content>
</Card.Root>
