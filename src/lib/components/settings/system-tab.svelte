<script lang="ts">
    import { toast } from "svelte-sonner";
    import { invalidateAll } from "$app/navigation";
    import { gqlClient } from "$lib/graphql-client";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import Loader2 from "@lucide/svelte/icons/loader-2";

    const RESET_LIBRARY = `mutation { resetLibrary }`;

    let open = $state(false);
    let loading = $state(false);

    async function resetLibrary() {
        try {
            const result = await gqlClient<{ resetLibrary: number }>(RESET_LIBRARY);
            await invalidateAll();
            toast.success(`Library reset — ${result.resetLibrary} items removed.`);
        } catch {
            toast.error("Failed to reset library");
        }
    }
</script>

<div class="space-y-8">
    <section class="space-y-4">
        <div>
            <h2 class="text-destructive text-lg font-semibold tracking-tight">Danger zone</h2>
            <p class="text-muted-foreground mt-1 text-sm">
                Destructive actions. These cannot be undone.
            </p>
        </div>

        <div
            class="border-destructive/30 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
                <p class="font-medium">Reset library</p>
                <p class="text-muted-foreground text-sm">
                    Removes all media items, streams, downloads and requests. Your settings, plugin
                    configuration and ranking profiles are preserved. Files already on disk are not
                    deleted.
                </p>
            </div>

            <AlertDialog.Root bind:open>
                <AlertDialog.Trigger>
                    {#snippet child({ props })}
                        <Button variant="destructive" class="shrink-0" {...props}>
                            Reset library
                        </Button>
                    {/snippet}
                </AlertDialog.Trigger>
                <AlertDialog.Content
                    class="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
                    <AlertDialog.Header>
                        <AlertDialog.Title>Reset the entire library?</AlertDialog.Title>
                        <AlertDialog.Description>
                            This permanently removes every media item, stream, download and request
                            from Riven's database. Your setup (settings, plugins, ranking profiles)
                            is kept. On-disk files are left untouched. This cannot be undone.
                        </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                        <AlertDialog.Cancel disabled={loading}>Cancel</AlertDialog.Cancel>
                        <AlertDialog.Action
                            disabled={loading}
                            onclick={async () => {
                                loading = true;
                                await resetLibrary();
                                loading = false;
                                open = false;
                            }}>
                            {#if loading}
                                <Loader2 class="mr-1 inline-block animate-spin" />
                            {/if}
                            Reset library
                        </AlertDialog.Action>
                    </AlertDialog.Footer>
                </AlertDialog.Content>
            </AlertDialog.Root>
        </div>
    </section>
</div>
