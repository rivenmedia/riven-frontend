<script lang="ts">
    import { Field, getValueSnapshot, setValue, type FormState } from "@sjsf/form";
    import ServiceCard from "./service-card.svelte";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
    }

    let { form }: Props = $props();

    const formValue = $derived(getValueSnapshot(form) as Record<string, unknown>);
    const updaters = $derived((formValue?.updaters ?? {}) as Record<string, unknown>);

    const servers = [
        {
            key: "plex",
            title: "Plex",
            description: "Plex Media Server",
            fields: ["url", "token"]
        },
        {
            key: "jellyfin",
            title: "Jellyfin",
            description: "Jellyfin Media Server",
            fields: ["url", "api_key"]
        },
        {
            key: "emby",
            title: "Emby",
            description: "Emby Media Server",
            fields: ["url", "api_key"]
        }
    ];

    function getServerEnabled(serverKey: string): boolean {
        const server = updaters[serverKey] as Record<string, unknown> | undefined;
        return (server?.enabled as boolean) ?? false;
    }

    function setServerEnabled(serverKey: string, enabled: boolean) {
        const currentUpdaters = (formValue?.updaters ?? {}) as Record<string, unknown>;
        const currentServer = (currentUpdaters[serverKey] ?? {}) as Record<string, unknown>;

        setValue(form, {
            updaters: {
                ...currentUpdaters,
                [serverKey]: {
                    ...currentServer,
                    enabled
                }
            }
        });
    }
</script>

<div class="space-y-6">
    <!-- Global updater settings -->
    <div class="bg-muted/30 rounded-lg border p-4">
        <h4 class="mb-1 text-sm font-medium">Library Sync</h4>
        <p class="text-muted-foreground mb-3 text-xs">
            Configure how Riven syncs with your media servers
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
            <Field {form} path={["updaters", "library_path"]} />
            <Field {form} path={["updaters", "updater_interval"]} />
        </div>
    </div>

    <!-- Media servers -->
    <div class="space-y-4">
        <h4 class="text-sm font-medium">Media Servers</h4>
        {#each servers as server (server.key)}
            {@const isEnabled = getServerEnabled(server.key)}
            <ServiceCard
                title={server.title}
                description={server.description}
                enabled={isEnabled}
                onToggle={(enabled) => setServerEnabled(server.key, enabled)}>
                <div class="space-y-4">
                    {#each server.fields as fieldName (fieldName)}
                        <Field {form} path={["updaters", server.key, fieldName]} />
                    {/each}
                </div>
            </ServiceCard>
        {/each}
    </div>
</div>
