<script lang="ts" module>
    declare module "@sjsf/form" {
        interface UiOptions {
            shadcn4ApiKey?: Record<string, unknown>;
        }
    }
</script>

<script lang="ts">
    import { Datalist, getFormContext, inputAttributes, type ComponentProps } from "@sjsf/form";
    import { getThemeContext } from "@sjsf/shadcn4-theme";
    import { toast } from "svelte-sonner";
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import Copy from "@lucide/svelte/icons/copy";
    import RefreshCw from "@lucide/svelte/icons/refresh-cw";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";

    const ctx = getFormContext();
    const themeCtx = getThemeContext();
    const { Button } = $derived(themeCtx.components);

    let { value = $bindable(), config, handlers }: ComponentProps["textWidget"] = $props();
    let revealed = $state(false);
    let regenerating = $state(false);
    let showRegenerateConfirm = $state(false);

    const isRootApiKey = $derived(
        Array.isArray(config.path) && config.path.length === 1 && config.path[0] === "api_key"
    );

    const inputType = $derived(revealed ? "text" : "password");
    const attributes = $derived(inputAttributes(ctx, config, "shadcn4ApiKey", handlers, {}));
    const inputAttrs = $derived({
        ...attributes,
        type: inputType,
        autocomplete: "off" as const
    });

    async function copyToClipboard() {
        const str = typeof value === "string" ? value : "";
        if (!str) {
            toast.error("Nothing to copy");
            return;
        }
        try {
            await navigator.clipboard.writeText(str);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Failed to copy");
        }
    }

    function requestRegenerate() {
        if (!isRootApiKey || regenerating) return;
        showRegenerateConfirm = true;
    }

    async function confirmRegenerate() {
        if (!isRootApiKey || regenerating) return;
        showRegenerateConfirm = false;
        regenerating = true;
        try {
            const res = await fetch("/api/settings/regenerate-apikey", {
                method: "POST"
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to regenerate API key");
                return;
            }
            if (typeof data?.apiKey === "string") {
                value = data.apiKey;
                handlers.onchange?.();
                toast.success("API key regenerated. Copy the new key and save settings.");
            } else {
                toast.error("Invalid response");
            }
        } catch {
            toast.error("Failed to regenerate API key");
        } finally {
            regenerating = false;
        }
    }
</script>

<div class="flex flex-col gap-1.5">
    <div
        class="border-input ring-offset-background focus-within:ring-ring flex min-w-0 items-center gap-1 rounded-md border shadow-xs focus-within:ring-2 focus-within:ring-offset-2">
        <input
            bind:value
            {...inputAttrs}
            class="placeholder:text-muted-foreground min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50" />
        <div class="flex shrink-0 items-center gap-0.5 pr-1">
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onclick={() => (revealed = !revealed)}
                aria-label={revealed ? "Hide API key" : "Show API key"}>
                {#if revealed}
                    <EyeOff class="size-4" />
                {:else}
                    <Eye class="size-4" />
                {/if}
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onclick={copyToClipboard}
                aria-label="Copy to clipboard">
                <Copy class="size-4" />
            </Button>
            {#if isRootApiKey}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onclick={requestRegenerate}
                    disabled={regenerating}
                    aria-label="Regenerate API key">
                    <RefreshCw class="size-4 {regenerating ? 'animate-spin' : ''}" />
                </Button>
            {/if}
        </div>
    </div>
    {#if attributes.list && typeof attributes.list === "string"}
        <Datalist id={attributes.list} {config} />
    {/if}
</div>

<AlertDialog.Root bind:open={showRegenerateConfirm}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Regenerate API key?</AlertDialog.Title>
            <AlertDialog.Description>
                This will generate a new API key and invalidate the current one. You will need to
                update any applications using the old key. Continue?
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onclick={confirmRegenerate}>
                Regenerate
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
