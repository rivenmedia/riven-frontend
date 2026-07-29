<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
</script>

<div class="mx-auto grid w-full max-w-4xl gap-8">
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-semibold tracking-tight md:text-3xl">What Riven does</h2>
            <p class="text-muted-foreground mt-2 text-sm md:text-base">
                Riven ties your media server, scrapers, metadata providers, and request services
                into one workflow so new media can be found, matched, and delivered with the
                defaults you choose.
            </p>
        </div>

        <Card.Root class="rounded-3xl px-6 py-6">
            <Card.Header class="px-0 py-0">
                <Card.Title class="text-base">This setup will walk you through</Card.Title>
            </Card.Header>
            <Card.Content class="grid gap-4 px-0 pt-0 pb-0 md:grid-cols-3">
                <div class="space-y-1">
                    <p class="font-medium">Media server</p>
                    <p class="text-muted-foreground text-sm">
                        Choose where finished media should appear.
                    </p>
                </div>
                <div class="space-y-1">
                    <p class="font-medium">Sources and services</p>
                    <p class="text-muted-foreground text-sm">
                        Connect the scrapers, metadata, and request tools you actually use.
                    </p>
                </div>
                <div class="space-y-1">
                    <p class="font-medium">Defaults</p>
                    <p class="text-muted-foreground text-sm">
                        Pick profiles and instance preferences for how Riven should behave.
                    </p>
                </div>
            </Card.Content>
        </Card.Root>

        <p class="text-muted-foreground text-sm">
            Core boot variables like backend, database, and auth are still configured outside the
            app.
        </p>
    </div>
</div>
