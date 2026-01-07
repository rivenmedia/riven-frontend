<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import type { components } from "$lib/providers/riven";

    type Stream = components["schemas"]["Stream"];

    interface Props {
        stream: Stream;
        magnet: string;
        isSelected: boolean;
        onSelect: (magnet: string) => void;
        onScrape: (magnet: string) => void;
        showCheckbox?: boolean;
    }

    let { stream, magnet, isSelected, onSelect, onScrape, showCheckbox = true }: Props = $props();

    function getResolutionColor(resolution?: string): string {
        if (!resolution) return "bg-primary text-primary-foreground";
        if (resolution.includes("2160")) return "bg-chart-5 text-primary-foreground";
        if (resolution.includes("1440")) return "bg-chart-4 text-primary-foreground";
        if (resolution.includes("1080")) return "bg-chart-2 text-primary-foreground";
        if (resolution.includes("720")) return "bg-chart-3 text-primary-foreground";
        return "bg-primary text-primary-foreground";
    }
</script>

<div class="flex items-start gap-3">
    {#if showCheckbox}
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(magnet)} class="mt-4" />
    {/if}
    <Card.Root
        class="border-border hover:border-primary flex-1 cursor-pointer transition-all hover:shadow-md"
        onclick={() => onScrape(magnet)}>
        <Card.Content class="px-4 py-3">
            <div class="flex flex-col gap-2">
                <div class="flex items-start justify-between gap-2">
                    <p class="text-foreground min-w-0 flex-1 text-sm font-medium break-all">
                        {stream.raw_title}
                    </p>
                    <Badge variant={stream.rank > 0 ? "default" : "destructive"} class="shrink-0">
                        Rank: {stream.rank}
                    </Badge>
                </div>

                <div class="flex flex-wrap gap-2">
                    {#if stream.parsed_data.resolution}
                        <Badge class={getResolutionColor(stream.parsed_data.resolution)}>
                            {stream.parsed_data.resolution}
                        </Badge>
                    {/if}
                    {#if stream.parsed_data.quality}
                        <Badge variant="outline" class="border-border text-muted-foreground"
                            >{stream.parsed_data.quality}</Badge>
                    {/if}
                    {#if stream.parsed_data.hdr}
                        {#each stream.parsed_data.hdr as hdr (hdr)}
                            <Badge variant="outline" class="border-border text-muted-foreground"
                                >{hdr}</Badge>
                        {/each}
                    {/if}
                    {#if stream.parsed_data.codec}
                        <Badge variant="outline" class="border-border text-muted-foreground"
                            >{stream.parsed_data.codec.toUpperCase()}</Badge>
                    {/if}
                    {#if stream.parsed_data.audio}
                        {#each stream.parsed_data.audio as audio (audio)}
                            <Badge variant="outline" class="border-border text-muted-foreground"
                                >{audio}</Badge>
                        {/each}
                    {/if}
                    {#if stream.parsed_data.languages}
                        {#each stream.parsed_data.languages as lang (lang)}
                            <Badge variant="outline" class="border-border text-muted-foreground"
                                >{lang.toUpperCase()}</Badge>
                        {/each}
                    {/if}
                    {#if stream.is_cached}
                        <Badge class="bg-chart-1 text-primary-foreground">Cached</Badge>
                    {/if}
                </div>
            </div>
        </Card.Content>
    </Card.Root>
</div>
