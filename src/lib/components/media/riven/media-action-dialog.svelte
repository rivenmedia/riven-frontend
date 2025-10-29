<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import type { ButtonWrapperProps } from "$lib/types/button";

    interface Props extends ButtonWrapperProps {
        title: string;
        description: string;
        buttonText: string;
        actionButtonText: string;
        onAction: () => Promise<void>;
    }

    let {
        title,
        description,
        buttonText,
        actionButtonText,
        variant = "ghost",
        size = "sm",
        onAction,
        ...restProps
    }: Props = $props();

    let open = $state(false);
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Trigger>
        {#snippet child({ props })}
            <Button {variant} {size} {...restProps} {...props}>{buttonText}</Button>
        {/snippet}
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>
                {title}
            </AlertDialog.Title>
            <AlertDialog.Description>
                {description}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={async () => {
                    await onAction();
                    open = false;
                }}>{actionButtonText}</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
