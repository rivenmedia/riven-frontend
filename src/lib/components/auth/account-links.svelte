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
        providers: Record<string, { enabled: boolean; disableSignup: boolean }>;
    } = $props();
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Account Links</Card.Title>
        <Card.Description>Manage your linked authentication providers.</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="flex flex-col gap-4">
            {#each Object.entries(providers) as [providerId, config]}
                {#if config.enabled && providerId !== "credential"}
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="uppercase">{providerId}</span>
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
                                    goto("/auth", { invalidateAll: true });
                                }}>
                                <Link2Off class="mr-2 h-4 w-4" />
                                Unlink
                            </Button>
                        {:else}
                            <Button
                                size="sm"
                                onclick={async () => {
                                    await authClient.linkSocial({
                                        provider: providerId
                                    });
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
