<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    let { state, class: className }: { state: string; class?: string } = $props();

    const variant = $derived(state === "Unknown" ? "destructive" : "secondary");
</script>

<Badge
    {variant}
    class={cn(
        "inline-flex items-center justify-center px-2 py-0.5 text-xs backdrop-blur-sm",
        state === "Completed" && "bg-green-500/90 text-black hover:bg-green-500/80",
        state !== "Completed" &&
            state !== "Unknown" &&
            "bg-yellow-500/90 text-white hover:bg-yellow-500/80",
        className
    )}>{state}</Badge>
