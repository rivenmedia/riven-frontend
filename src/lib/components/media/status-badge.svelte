<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { cn } from "$lib/utils";

    type Size = "sm" | "default";

    let {
        state,
        size = "sm",
        class: className
    }: { state: string; size?: Size; class?: string } = $props();

    const sizeClasses = $derived(
        size === "default" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs"
    );
</script>

<Badge
    variant="secondary"
    class={cn(
        "inline-flex items-center justify-center backdrop-blur-sm",
        sizeClasses,
        state === "Completed" && "bg-emerald-600/80 text-emerald-50 hover:bg-emerald-600/70",
        state === "PartiallyCompleted" && "bg-teal-600/80 text-teal-50 hover:bg-teal-600/70",
        state === "Ongoing" && "bg-amber-500/80 text-amber-50 hover:bg-amber-500/70",
        state === "Scraped" && "bg-sky-600/80 text-sky-50 hover:bg-sky-600/70",
        state === "Indexed" && "bg-blue-600/80 text-blue-50 hover:bg-blue-600/70",
        state === "Unreleased" && "bg-slate-500/80 text-slate-50 hover:bg-slate-500/70",
        state === "Paused" && "bg-slate-500/80 text-slate-50 hover:bg-slate-500/70",
        state === "Failed" && "bg-red-600/80 text-red-50 hover:bg-red-600/70",
        ![
            "Completed",
            "PartiallyCompleted",
            "Ongoing",
            "Scraped",
            "Indexed",
            "Unreleased",
            "Paused",
            "Failed"
        ].includes(state) && "bg-amber-600/80 text-amber-50 hover:bg-amber-600/70",
        className
    )}>{state}</Badge>
