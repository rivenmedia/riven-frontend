<script lang="ts">
    import { Field, getValueSnapshot, type FormState } from "@sjsf/form";
    import ServiceCard from "./service-card.svelte";
    import { createToggleHelpers } from "./toggle-helpers";

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: FormState<any>;
    }

    let { form }: Props = $props();

    // Get reactive form values
    const formValue = $derived(getValueSnapshot(form) as Record<string, unknown>);

    const { getEnabled, setEnabled } = createToggleHelpers(
        () => form,
        () => formValue,
        "content"
    );

    // Service definitions with their display info
    const services = [
        {
            key: "overseerr",
            title: "Overseerr",
            description: "Request management for Plex",
            fields: ["url", "api_key", "update_interval", "use_webhook"]
        },
        {
            key: "plex_watchlist",
            title: "Plex Watchlist",
            description: "Monitor Plex watchlists via RSS",
            fields: ["rss", "update_interval"]
        },
        {
            key: "mdblist",
            title: "MDBList",
            description: "Curated movie and TV lists",
            fields: ["api_key", "lists", "update_interval"]
        },
        {
            key: "listrr",
            title: "Listrr",
            description: "Trakt and IMDB list automation",
            fields: ["api_key", "movie_lists", "show_lists", "update_interval"]
        },
        {
            key: "trakt",
            title: "Trakt",
            description: "Track what you watch",
            fields: [
                "api_key",
                "watchlist",
                "user_lists",
                "collection",
                "fetch_trending",
                "trending_count",
                "fetch_popular",
                "popular_count",
                "update_interval"
            ]
        }
    ];
</script>

<div class="space-y-4">
    {#each services as service (service.key)}
        {@const isEnabled = getEnabled(service.key)}
        <ServiceCard
            title={service.title}
            description={service.description}
            enabled={isEnabled}
            onToggle={(enabled) => setEnabled(service.key, enabled)}>
            <div class="space-y-4">
                {#each service.fields as fieldName (fieldName)}
                    <Field {form} path={["content", service.key, fieldName]} />
                {/each}
            </div>
        </ServiceCard>
    {/each}
</div>
