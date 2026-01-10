<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    type Size = "sm" | "default";

    let {
        state,
        size = "sm",
        class: className
    }: { state: string; size?: Size; class?: string } = $props();

    const KNOWN_STATES = ["Completed", "Requested", "Downloading", "Paused", "Unknown"];
    const isDefaultState = $derived(!KNOWN_STATES.includes(state));

    const variant = $derived(state === "Unknown" ? "destructive" : "secondary");

    const sizeClasses = $derived(
        size === "default" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs"
    );
</script>

<Badge
    {variant}
    class={cn(
        "inline-flex items-center justify-center backdrop-blur-sm",
        sizeClasses,
        state === "Completed" && "bg-emerald-600/80 text-emerald-50 hover:bg-emerald-600/70",
        state === "Requested" && "bg-sky-600/80 text-sky-50 hover:bg-sky-600/70",
        state === "Downloading" && "bg-amber-600/80 text-amber-50 hover:bg-amber-600/70",
        state === "Paused" && "bg-slate-500/80 text-slate-50 hover:bg-slate-500/70",
        isDefaultState && "bg-amber-600/80 text-amber-50 hover:bg-amber-600/70",
        className
    )}>{state}</Badge>
