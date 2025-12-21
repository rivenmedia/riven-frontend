<script lang="ts">
    import { Field, getValueSnapshot, setValue, type FormState } from "@sjsf/form";
    import { Switch } from "$lib/components/ui/switch";
    import * as Card from "$lib/components/ui/card";
    import { slide } from "svelte/transition";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
    }

    let { form }: Props = $props();

    const formValue = $derived(getValueSnapshot(form) as Record<string, unknown>);
    const notifications = $derived((formValue?.notifications ?? {}) as Record<string, unknown>);

    let expanded = $state(false);

    const isEnabled = $derived((notifications?.enabled as boolean) ?? false);

    $effect(() => {
        if (isEnabled) {
            expanded = true;
        }
    });

    function setEnabled(enabled: boolean) {
        const currentNotifications = (formValue?.notifications ?? {}) as Record<string, unknown>;

        setValue(form, {
            notifications: {
                ...currentNotifications,
                enabled
            }
        });

        if (enabled) {
            expanded = true;
        }
    }
</script>

<div class="space-y-4">
    <Card.Root class="overflow-hidden">
        <!-- Using div instead of button to avoid nested button issue (Switch renders a button) -->
        <div
            role="button"
            tabindex="0"
            class="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors"
            onclick={() => (expanded = !expanded)}
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    expanded = !expanded;
                }
            }}>
            <div class="flex items-center gap-3">
                <!-- Wrapper to stop click propagation to parent - switch has its own a11y handling -->
                <span role="presentation" onclick={(e: MouseEvent) => e.stopPropagation()}>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => setEnabled(checked)} />
                </span>
                <div>
                    <h4 class="font-medium">Enable Notifications</h4>
                    {#if !isEnabled}
                        <p class="text-muted-foreground text-sm">
                            Send notifications when items complete downloading
                        </p>
                    {/if}
                </div>
            </div>
            <ChevronDown
                class="text-muted-foreground h-5 w-5 transition-transform duration-200 {expanded
                    ? 'rotate-180'
                    : ''}" />
        </div>

        {#if expanded}
            <div transition:slide={{ duration: 200 }}>
                <Card.Content class="space-y-4 border-t pt-4">
                    <Field {form} path={["notifications", "on_item_type"]} />
                    <Field {form} path={["notifications", "service_urls"]} />
                </Card.Content>
            </div>
        {/if}
    </Card.Root>
</div>
