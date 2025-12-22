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
        "scraping"
    );

    const providers = [
        {
            key: "torrentio",
            title: "Torrentio",
            description: "Stremio addon for torrent streaming",
            fields: ["url", "filter", "timeout", "retries", "ratelimit", "proxy_url"]
        },
        {
            key: "jackett",
            title: "Jackett",
            description: "Indexer proxy for torrent sites",
            fields: ["url", "api_key", "timeout", "retries", "infohash_fetch_timeout", "ratelimit"]
        },
        {
            key: "prowlarr",
            title: "Prowlarr",
            description: "Indexer manager and proxy",
            fields: [
                "url",
                "api_key",
                "timeout",
                "retries",
                "infohash_fetch_timeout",
                "ratelimit",
                "limiter_seconds"
            ]
        },
        {
            key: "orionoid",
            title: "Orionoid",
            description: "Premium torrent indexer",
            fields: [
                "api_key",
                "cached_results_only",
                "timeout",
                "retries",
                "ratelimit",
                "parameters"
            ]
        },
        {
            key: "mediafusion",
            title: "MediaFusion",
            description: "Stremio addon aggregator",
            fields: ["url", "timeout", "retries", "ratelimit"]
        },
        {
            key: "zilean",
            title: "Zilean",
            description: "DMM scraper service",
            fields: ["url", "timeout", "retries", "ratelimit"]
        },
        {
            key: "comet",
            title: "Comet",
            description: "Stremio addon for debrid",
            fields: ["url", "timeout", "retries", "ratelimit"]
        },
        {
            key: "rarbg",
            title: "RARBG",
            description: "RARBG torrent clone",
            fields: ["url", "timeout", "retries", "ratelimit"]
        }
    ];
</script>

<div class="space-y-6">
    <!-- Global scraping settings - organized by function -->
    <div class="bg-muted/30 space-y-6 rounded-lg border p-4">
        <!-- Retry Delays -->
        <div>
            <h4 class="mb-1 text-sm font-medium">Retry Delays</h4>
            <p class="text-muted-foreground mb-3 text-xs">
                Hours to wait after consecutive scrape failures
            </p>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field {form} path={["scraping", "after_2"]} />
                <Field {form} path={["scraping", "after_5"]} />
                <Field {form} path={["scraping", "after_10"]} />
                <Field {form} path={["scraping", "max_failed_attempts"]} />
            </div>
        </div>

        <!-- Matching Options -->
        <div class="border-t pt-4">
            <h4 class="mb-1 text-sm font-medium">Matching Options</h4>
            <p class="text-muted-foreground mb-3 text-xs">
                Control how content is matched and filtered
            </p>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field {form} path={["scraping", "bucket_limit"]} />
                <div class="flex items-center">
                    <Field {form} path={["scraping", "enable_aliases"]} />
                </div>
                <div class="flex items-center">
                    <Field {form} path={["scraping", "dubbed_anime_only"]} />
                </div>
            </div>
        </div>
    </div>

    <!-- Scraper providers -->
    <div class="space-y-4">
        <h4 class="text-sm font-medium">Scraper Providers</h4>
        {#each providers as provider (provider.key)}
            {@const isEnabled = getEnabled(provider.key)}
            <ServiceCard
                title={provider.title}
                description={provider.description}
                enabled={isEnabled}
                onToggle={(enabled) => setEnabled(provider.key, enabled)}>
                <div class="space-y-4">
                    {#each provider.fields as fieldName (fieldName)}
                        <Field {form} path={["scraping", provider.key, fieldName]} />
                    {/each}
                </div>
            </ServiceCard>
        {/each}
    </div>
</div>
