<script lang="ts">
    import * as Card from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import type { Stream } from "$lib/api/types.gen";

    interface Props {
        stream: Stream;
        magnet: string;
        isSelected: boolean;
        onSelect: (magnet: string) => void;
        onScrape: (magnet: string) => void;
        showCheckbox?: boolean;
    }

    interface ParsedTitleData {
        seasons?: number[];
        episodes?: number[];
        resolution?: string;
        quality?: string;
        hdr?: string[];
        codec?: string;
        audio?: string[];
        languages?: string[];
    }

    let { stream, magnet, isSelected, onSelect, onScrape, showCheckbox = true }: Props = $props();

    let parsedData = $derived(stream.parsed_data as ParsedTitleData);

    function getResolutionColor(resolution?: string): string {
        if (!resolution) return "bg-pink-600";
        if (resolution.includes("2160")) return "bg-purple-600";
        if (resolution.includes("1440")) return "bg-indigo-600";
        if (resolution.includes("1080")) return "bg-blue-600";
        if (resolution.includes("720")) return "bg-yellow-600";
        return "bg-pink-600";
    }
</script>

<div class="flex items-start gap-3">
    {#if showCheckbox}
        <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onSelect(magnet)}
            class="mt-4"
        />
    {/if}
    <Card.Root
        class="flex-1 cursor-pointer transition-all hover:border-primary hover:shadow-md"
        onclick={() => onScrape(magnet)}>
        <Card.Content class="px-4 py-3">
            <div class="flex flex-col gap-2">
                <div class="flex items-start justify-between gap-2">
                    <p class="text-sm font-medium break-all flex-1 min-w-0">{stream.raw_title}</p>
                    <Badge variant={stream.rank > 0 ? "default" : "destructive"} class="shrink-0">
                        Rank: {stream.rank}
                    </Badge>
                </div>

                <div class="flex flex-wrap gap-2">
                    {#if parsedData.resolution}
                        <Badge class={getResolutionColor(parsedData.resolution)}>
                            {parsedData.resolution}
                        </Badge>
                    {/if}
                    {#if parsedData.quality}
                        <Badge variant="outline">{parsedData.quality}</Badge>
                    {/if}
                    {#if parsedData.hdr}
                        {#each parsedData.hdr as hdr (hdr)}
                            <Badge variant="outline">{hdr}</Badge>
                        {/each}
                    {/if}
                    {#if parsedData.codec}
                        <Badge variant="outline">{parsedData.codec.toUpperCase()}</Badge>
                    {/if}
                    {#if parsedData.audio}
                        {#each parsedData.audio as audio (audio)}
                            <Badge variant="outline">{audio}</Badge>
                        {/each}
                    {/if}
                    {#if parsedData.languages}
                        {#each parsedData.languages as lang (lang)}
                            <Badge variant="outline">{lang.toUpperCase()}</Badge>
                        {/each}
                    {/if}
                    {#if (stream as any).is_cached}
                        <Badge class="bg-green-600">Cached</Badge>
                    {/if}
                </div>
            </div>
        </Card.Content>
    </Card.Root>
</div>
