<script lang="ts">
    import { browser } from "$app/environment";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";

    interface Props {
        open: boolean;
        onDiscard: () => void;
        onCancel: () => void;
    }

    let { open, onDiscard, onCancel }: Props = $props();
</script>

<!-- bits-ui AlertDialog doesn't support SSR -->
{#if browser}
    <AlertDialog.Root {open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Unsaved Changes</AlertDialog.Title>
                <AlertDialog.Description>
                    You have unsaved changes that will be lost. Do you want to discard them?
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
                <AlertDialog.Cancel onclick={onCancel}>Keep Editing</AlertDialog.Cancel>
                <Button variant="destructive" onclick={onDiscard}>Discard Changes</Button>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>
{/if}
