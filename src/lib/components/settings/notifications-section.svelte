<script lang="ts">
    import { Field, getValueSnapshot, setValue, type Schema } from "@sjsf/form";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import CollapsibleCard from "./collapsible-card.svelte";
    import { getSchemaAtPath } from "./schema-utils";
    import type { SettingsFormState, AppSettings } from "./form-defaults";
    import type { SettingsSection } from "./settings-sections";

    interface Props {
        form: SettingsFormState;
        schema: Schema;
        section: SettingsSection;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- props passed for interface consistency
    let { form, schema, section: _section }: Props = $props();

    type FieldPath = Parameters<typeof Field>[1]["path"];

    const notificationSchema = $derived(getSchemaAtPath(schema, "notifications"));
    const sectionDescription = $derived(
        notificationSchema?.description || "Send notifications when items complete downloading"
    );

    // Get field metadata from schema
    const itemTypeSchema = $derived(getSchemaAtPath(schema, "notifications.on_item_type"));
    const itemTypeTitle = $derived(itemTypeSchema?.title || "Item Types");
    const itemTypeDescription = $derived(itemTypeSchema?.description || "");

    // Known item types - backend schema lacks enum constraint (to be fixed)
    const ITEM_TYPES = ["movie", "show", "season", "episode"] as const;

    const formValue = $derived(getValueSnapshot(form) as AppSettings);
    const notifications = $derived(formValue?.notifications);
    const selectedItemTypes = $derived(notifications?.on_item_type ?? []);
    const isEnabled = $derived(notifications?.enabled ?? false);

    function setEnabled(enabled: boolean) {
        const currentNotifications = formValue?.notifications ?? {};
        setValue(form, {
            notifications: {
                ...currentNotifications,
                enabled
            }
        } as AppSettings);
    }

    function toggleItemType(item: string, checked: boolean) {
        const current = [...selectedItemTypes];
        if (checked && !current.includes(item)) {
            current.push(item);
        } else if (!checked) {
            const index = current.indexOf(item);
            if (index > -1) current.splice(index, 1);
        }
        setValue(form, {
            notifications: {
                ...notifications,
                on_item_type: current
            }
        } as AppSettings);
    }

    function formatLabel(item: string): string {
        return item.charAt(0).toUpperCase() + item.slice(1) + "s";
    }
</script>

<div class="space-y-4">
    <CollapsibleCard
        title={notificationSchema?.title || "Notifications"}
        description={sectionDescription}
        hasToggle
        enabled={isEnabled}
        onToggle={setEnabled}
        contentClass="space-y-6">
        <!-- Item types as checkboxes -->
        <div class="space-y-2">
            <div class="text-sm font-medium">{itemTypeTitle}</div>
            {#if itemTypeDescription}
                <p class="text-muted-foreground text-xs">{itemTypeDescription}</p>
            {/if}
            <div class="flex flex-wrap gap-4">
                {#each ITEM_TYPES as item (item)}
                    <div class="flex items-center gap-2">
                        <Checkbox
                            id={`notify-${item}`}
                            checked={selectedItemTypes.includes(item)}
                            onCheckedChange={(checked) => toggleItemType(item, checked === true)} />
                        <Label for={`notify-${item}`} class="cursor-pointer text-sm">
                            {formatLabel(item)}
                        </Label>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Service URLs - let the library render -->
        <Field {form} path={["notifications", "service_urls"] as FieldPath} />
    </CollapsibleCard>
</div>
