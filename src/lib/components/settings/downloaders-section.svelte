<script lang="ts">
    import { Field, getValueSnapshot, type FormState } from "@sjsf/form";
    import ServiceCard from "./service-card.svelte";
    import { createToggleHelpers } from "./toggle-helpers";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
    }

    let { form }: Props = $props();

    const formValue = $derived(getValueSnapshot(form) as Record<string, unknown>);

    const { getEnabled, setEnabled } = createToggleHelpers(
        () => form,
        () => formValue,
        "downloaders"
    );

    const services = [
        {
            key: "real_debrid",
            title: "Real-Debrid",
            description: "Real-Debrid debrid service",
            fields: ["api_key"]
        },
        {
            key: "debrid_link",
            title: "Debrid-Link",
            description: "Debrid-Link debrid service",
            fields: ["api_key"]
        },
        {
            key: "all_debrid",
            title: "AllDebrid",
            description: "AllDebrid debrid service",
            fields: ["api_key"]
        }
    ];
</script>

<div class="space-y-6">
    <!-- Global downloader settings - organized by function -->
    <div class="bg-muted/30 space-y-6 rounded-lg border p-4">
        <!-- File Size Limits -->
        <div>
            <h4 class="mb-1 text-sm font-medium">File Size Limits</h4>
            <p class="text-muted-foreground mb-3 text-xs">
                Minimum and maximum file sizes in MB (-1 for no limit)
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-3">
                    <p class="text-muted-foreground text-xs font-medium">Movies</p>
                    <div class="grid grid-cols-2 gap-2">
                        <Field {form} path={["downloaders", "movie_filesize_mb_min"]} />
                        <Field {form} path={["downloaders", "movie_filesize_mb_max"]} />
                    </div>
                </div>
                <div class="space-y-3">
                    <p class="text-muted-foreground text-xs font-medium">Episodes</p>
                    <div class="grid grid-cols-2 gap-2">
                        <Field {form} path={["downloaders", "episode_filesize_mb_min"]} />
                        <Field {form} path={["downloaders", "episode_filesize_mb_max"]} />
                    </div>
                </div>
            </div>
        </div>

        <!-- Other Settings -->
        <div class="border-t pt-4">
            <h4 class="mb-1 text-sm font-medium">Other Settings</h4>
            <p class="text-muted-foreground mb-3 text-xs">File types and network configuration</p>
            <div class="grid gap-4 sm:grid-cols-2">
                <Field {form} path={["downloaders", "video_extensions"]} />
                <Field {form} path={["downloaders", "proxy_url"]} />
            </div>
        </div>
    </div>

    <!-- Debrid services -->
    <div class="space-y-4">
        <h4 class="text-sm font-medium">Debrid Services</h4>
        {#each services as service (service.key)}
            {@const isEnabled = getEnabled(service.key)}
            <ServiceCard
                title={service.title}
                description={service.description}
                enabled={isEnabled}
                onToggle={(enabled) => setEnabled(service.key, enabled)}>
                <div class="space-y-4">
                    {#each service.fields as fieldName (fieldName)}
                        <Field {form} path={["downloaders", service.key, fieldName]} />
                    {/each}
                </div>
            </ServiceCard>
        {/each}
    </div>
</div>
