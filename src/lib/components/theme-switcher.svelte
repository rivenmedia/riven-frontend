<script lang="ts">
    import { setTheme, theme, themeStorageKey } from "mode-watcher";
    import Pallete from "@lucide/svelte/icons/palette";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

    const themes = {
        darkmatter: "Dark Matter",
        amberminimal: "Amber Minimal",
        bubblegum: "Bubblegum",
        caffeine: "Caffeine",
        cyberpunk: "Cyberpunk",
        doom64: "Doom 64",
        mono: "Mono",
        neobrutalism: "Neo Brutalism"
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
    <DropdownMenu.Content>
        <DropdownMenu.Group class="space-y-1 p-2">
            <DropdownMenu.Label>La Pallete</DropdownMenu.Label>
            <DropdownMenu.Separator />
            {#each Object.entries(themes) as [key, name] (key)}
                <DropdownMenu.Item
                    class={theme.current === key
                        ? "bg-accent/80 hover:bg-accent/90"
                        : "hover:bg-accent/80"}
                    onclick={() => {
                        setTheme(key);
                    }}>
                    {name}
                </DropdownMenu.Item>
            {/each}
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>
