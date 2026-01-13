<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import * as Card from "$lib/components/ui/card/index.js";
    import { toast } from "svelte-sonner";
    import Fingerprint from "@lucide/svelte/icons/fingerprint";
    import Pencil from "@lucide/svelte/icons/pencil";
    import Check from "@lucide/svelte/icons/check";
    import X from "@lucide/svelte/icons/x";
    import { onMount } from "svelte";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { createScopedLogger } from "$lib/logger";

    const logger = createScopedLogger("passkeys");

    interface Passkey {
        id: string;
        name: string;
        createdAt: string | Date;
    }

    let isRegisteringPasskey = $state(false);
    let userPasskeys = $state<Passkey[]>([]);
    let isLoadingPasskeys = $state(true);
    let editingPasskeyId = $state<string | null>(null);
    let editingPasskeyName = $state<string>("");
    let isUpdatingPasskey = $state(false);

    onMount(async () => {
        await loadPasskeys();
    });

    async function loadPasskeys() {
        isLoadingPasskeys = true;
        try {
            const response = await authClient.passkey.listUserPasskeys();
            userPasskeys = (response.data || []) as Passkey[];
        } catch (error) {
            logger.error("Failed to load passkeys:", error);
            userPasskeys = [];
        } finally {
            isLoadingPasskeys = false;
        }
    }

    async function handleRegisterPasskey() {
        isRegisteringPasskey = true;
        try {
            await authClient.passkey.addPasskey({
                fetchOptions: {
                    onSuccess() {
                        toast.success("Passkey registered successfully!");
                        loadPasskeys();
                    },
                    onError(context) {
                        toast.error(context.error.message || "Failed to register passkey");
                    }
                }
            });
        } catch {
            toast.error("Failed to register passkey");
        } finally {
            isRegisteringPasskey = false;
        }
    }

    function startEditingPasskey(passkey: Passkey) {
        editingPasskeyId = passkey.id;
        editingPasskeyName = passkey.name || "";
    }

    function cancelEditingPasskey() {
        editingPasskeyId = null;
        editingPasskeyName = "";
    }

    async function savePasskeyName(passkeyId: string) {
        if (!editingPasskeyName.trim()) {
            toast.error("Passkey name cannot be empty");
            return;
        }

        isUpdatingPasskey = true;
        try {
            const { error } = await authClient.passkey.updatePasskey({
                id: passkeyId,
                name: editingPasskeyName.trim()
            });

            if (error) {
                toast.error(error.message || "Failed to update passkey name");
            } else {
                toast.success("Passkey name updated successfully!");
                editingPasskeyId = null;
                editingPasskeyName = "";
                await loadPasskeys();
            }
        } catch {
            toast.error("Failed to update passkey name");
        } finally {
            isUpdatingPasskey = false;
        }
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title>Passkeys</Card.Title>
        <Card.Description>
            Manage your passkeys for secure, passwordless authentication
        </Card.Description>
    </Card.Header>
    <Card.Content>
        {#if isLoadingPasskeys}
            <p class="text-muted-foreground text-sm">Loading passkeys...</p>
        {:else if userPasskeys.length > 0}
            <div class="mb-4 space-y-2">
                {#each userPasskeys as passkey (passkey.id)}
                    <div class="flex items-center justify-between rounded-lg border p-3">
                        <div class="flex flex-1 items-center gap-3">
                            <Fingerprint class="text-muted-foreground h-5 w-5" />
                            <div class="flex-1">
                                {#if editingPasskeyId === passkey.id}
                                    <Input
                                        bind:value={editingPasskeyName}
                                        disabled={isUpdatingPasskey}
                                        placeholder="Enter passkey name"
                                        class="h-8" />
                                {:else}
                                    <p class="text-sm font-medium">
                                        {passkey.name || "Unnamed Passkey"}
                                    </p>
                                {/if}
                                <p class="text-muted-foreground text-xs">
                                    Created {new Date(passkey.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            {#if editingPasskeyId === passkey.id}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={isUpdatingPasskey}
                                    onclick={() => savePasskeyName(passkey.id)}
                                    class="h-8 w-8">
                                    <Check class="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={isUpdatingPasskey}
                                    onclick={cancelEditingPasskey}
                                    class="h-8 w-8">
                                    <X class="h-4 w-4" />
                                </Button>
                            {:else}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onclick={() => startEditingPasskey(passkey)}
                                    class="h-8 w-8">
                                    <Pencil class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onclick={async () => {
                                        try {
                                            await authClient.passkey.deletePasskey({
                                                id: passkey.id,
                                                fetchOptions: {
                                                    onSuccess() {
                                                        toast.success(
                                                            "Passkey deleted successfully"
                                                        );
                                                        loadPasskeys();
                                                    },
                                                    onError(context) {
                                                        toast.error(
                                                            context.error.message ||
                                                                "Failed to delete passkey"
                                                        );
                                                    }
                                                }
                                            });
                                        } catch {
                                            toast.error("Failed to delete passkey");
                                        }
                                    }}>
                                    Delete
                                </Button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <p class="text-muted-foreground mb-4 text-sm">
                No passkeys registered yet. Add a passkey for faster, more secure login.
            </p>
        {/if}

        <Button variant="outline" disabled={isRegisteringPasskey} onclick={handleRegisterPasskey}>
            <Fingerprint class="mr-2 h-4 w-4" />
            {isRegisteringPasskey ? "Registering..." : "Add Passkey"}
        </Button>
    </Card.Content>
</Card.Root>
