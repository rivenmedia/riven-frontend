<script lang="ts">
    import { setTheme, theme } from "mode-watcher";
    import Pallete from "@lucide/svelte/icons/palette";
    import Check from "@lucide/svelte/icons/check";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

    const themes = {
        amberminimal: "Amber Minimal",
        amethysthaze: "Amethyst Haze",
        bubblegum: "Bubblegum",
        caffeine: "Caffeine",
        catppuccin: "Catppuccin",
        cyberpunk: "Cyberpunk",
        darkmatter: "Dark Matter",
        doom64: "Doom 64",
        galacticglitch: "Galactic Glitch",
        graphite: "Graphite",
        mochamousse: "Mocha Mousse",
        mono: "Mono",
        neobrutalism: "Neo Brutalism",
        solardusk: "Solar Dusk",
        "t3-chat": "T3 Chat"
    };
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        {#snippet child({ props })}
            <Button variant="ghost" size="icon" aria-label="Change Theme" {...props}>
                <Pallete />
            </Button>
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
        side="right"
        align="end"
        class="rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <DropdownMenu.Group class="space-y-1 p-2">
            <DropdownMenu.Label>La Pallete</DropdownMenu.Label>
            <DropdownMenu.Separator />
            {#each Object.entries(themes) as [key, name] (key)}
                <DropdownMenu.Item
                    class="flex items-center justify-between {theme.current === key
                        ? 'bg-accent/80 hover:bg-accent/90'
                        : 'hover:bg-accent/80'}"
                    onclick={() => {
                        setTheme(key);
                    }}>
                    <span>{name}</span>
                    {#if theme.current === key}
                        <Check class="ml-2 size-4" />
                    {/if}
                </DropdownMenu.Item>
            {/each}
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>
