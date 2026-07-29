<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";

    let {
        validPluginCount,
        enabledProfileCount,
        readyToComplete,
        blockers,
        finishSetup
    }: {
        validPluginCount: number;
        enabledProfileCount: number;
        readyToComplete: boolean;
        blockers: string[];
        finishSetup: () => void;
    } = $props();
</script>

<div class="space-y-8">
    <div>
        <h2 class="text-3xl font-semibold tracking-tight">Review and Finish</h2>
        <p class="text-muted-foreground mt-3 max-w-3xl text-sm">
            You can continue tuning things later in Settings, but this is the point where the
            instance should be usable.
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border p-5">
            <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Valid Plugins
            </p>
            <p class="mt-2 text-3xl font-semibold">{validPluginCount}</p>
        </div>
        <div class="rounded-2xl border p-5">
            <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Enabled Profiles
            </p>
            <p class="mt-2 text-3xl font-semibold">{enabledProfileCount}</p>
        </div>
        <div class="rounded-2xl border p-5">
            <p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Status</p>
            <p class="mt-2 text-3xl font-semibold">{readyToComplete ? "Ready" : "Review"}</p>
        </div>
    </div>

    <div class="rounded-2xl border p-5">
        {#if readyToComplete}
            <p class="font-medium">Everything looks ready.</p>
            <p class="text-muted-foreground mt-2 text-sm">
                Your instance has the minimum configuration needed to start.
            </p>
        {:else}
            <p class="font-medium">Before finishing</p>
            <ul class="text-muted-foreground mt-3 space-y-2 text-sm">
                {#each blockers as blocker (blocker)}
                    <li>{blocker}</li>
                {/each}
            </ul>
        {/if}
    </div>

    <div class="flex justify-end">
        <Button type="button" disabled={!readyToComplete} onclick={finishSetup}
            >Finish setup</Button>
    </div>
</div>
