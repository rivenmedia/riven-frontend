<script lang="ts">
    import type { PageProps } from "./$types";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { toast } from "svelte-sonner";
    import Fingerprint from "@lucide/svelte/icons/fingerprint";
    import Pencil from "@lucide/svelte/icons/pencil";
    import Check from "@lucide/svelte/icons/check";
    import X from "@lucide/svelte/icons/x";
    import { onMount } from "svelte";
    import { Input } from "$lib/components/ui/input/index.js";

    let { data }: PageProps = $props();
    $inspect(data);

    let isRegisteringPasskey = $state(false);
    let userPasskeys = $state<any[]>([]);
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
            // Load user's passkeys
            const response = await authClient.passkey.listUserPasskeys();
            userPasskeys = response.data || [];
        } catch (error) {
            console.error("Failed to load passkeys:", error);
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
        } catch (error) {
            toast.error("Failed to register passkey");
        } finally {
            isRegisteringPasskey = false;
        }
    }

    function startEditingPasskey(passkey: any) {
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
            const { data, error } = await authClient.passkey.updatePasskey({
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
        } catch (error) {
            toast.error("Failed to update passkey name");
        } finally {
            isUpdatingPasskey = false;
        }
    }
</script>

<svelte:head>
    <title>Profile - Riven</title>
</svelte:head>

<div class="mt-14 flex h-full flex-col p-6 md:p-8 md:px-16">
    <h1 class="text-3xl font-bold tracking-tight">{data.user.name}'s Profile</h1>

    <div class="mt-4 flex flex-col gap-4">
        <div class="flex flex-row items-center gap-4">
            <img
                src={data.user.image || "https://avatar.iran.liara.run/public"}
                alt={data.user.name}
                class="h-16 w-16 rounded-full object-cover" />
            <div>
                <p class="text-lg font-semibold">{data.user.name}</p>
                <p class="text-muted-foreground text-sm">{data.user.email}</p>
            </div>
        </div>

        <div class="flex flex-col">
            <p class="text-muted-foreground text-sm">
                Member since {new Date(data.user.createdAt).toLocaleDateString()}
            </p>

            <p class="text-muted-foreground text-sm">
                Last updated {new Date(data.user.updatedAt).toLocaleDateString()}
            </p>

            <p class="text-muted-foreground text-sm">
                Session expires at {new Date(data.session.expiresAt).toLocaleDateString()}
            </p>
        </div>
    </div>

    <div class="mt-8">
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
                        {#each userPasskeys as passkey}
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
                                            Created {new Date(
                                                passkey.createdAt
                                            ).toLocaleDateString()}
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
                                                    console.log("Deleting passkey:", passkey);
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
                                                } catch (error) {
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

                <Button
                    variant="outline"
                    disabled={isRegisteringPasskey}
                    onclick={handleRegisterPasskey}>
                    <Fingerprint class="mr-2 h-4 w-4" />
                    {isRegisteringPasskey ? "Registering..." : "Add Passkey"}
                </Button>
            </Card.Content>
        </Card.Root>
    </div>

    <div class="mt-4 flex flex-col">
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
