<script lang="ts">
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import { cn } from "$lib/utils";

    interface Props {
        class?: string;
    }

    let { class: className }: Props = $props();
</script>

<div
    class={cn("relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900 shadow-md", className)}>
    <!-- Inner Border Overlay (matches PortraitCard) -->
    <div class="pointer-events-none absolute inset-0 z-50 rounded-[inherit] border border-white/10">
    </div>

    <!-- Skeleton background -->
    <Skeleton class="absolute inset-0 h-full w-full rounded-none" />

    <!-- Content overlay skeleton (matches PortraitCard layout) -->
    <div class="absolute inset-0 flex flex-col justify-end">
        <div
            class="absolute inset-0 bg-black/90"
            style="mask-image: linear-gradient(to bottom, transparent 40%, black 90%);">
        </div>
        <div class="relative z-10 flex flex-col items-center gap-1.5 p-3">
            <Skeleton class="h-4 w-4/5 rounded" />
            <Skeleton class="h-3 w-1/2 rounded" />
        </div>
    </div>
</div>
