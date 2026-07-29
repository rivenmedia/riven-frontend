<script lang="ts">
    import Mountain from "@lucide/svelte/icons/mountain";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import type { Step } from "./types";
    import type { Snippet } from "svelte";

    let {
        steps,
        stepIndex,
        goToStep,
        previousStep,
        nextStep,
        children
    }: {
        steps: Step[];
        stepIndex: number;

        goToStep: (index: number) => void;
        previousStep: () => void;
        nextStep: () => void;
        children: Snippet;
    } = $props();

    const currentStep = $derived(steps[stepIndex] ?? steps[0]);
</script>

<div class="bg-background min-h-screen w-full">
    <div class="relative min-h-screen overflow-hidden">
        <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#31231c_0%,transparent_34%),radial-gradient(circle_at_right,#1b171d_0%,transparent_26%),linear-gradient(180deg,#0f0d10_0%,#151115_100%)]">
        </div>
        <div
            class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]">
        </div>

        <div
            class="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10 lg:px-12">
            <div class="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p
                        class="text-muted-foreground text-xs font-medium tracking-[0.28em] uppercase">
                        Initial Setup
                    </p>
                    <div class="mt-3 flex items-center gap-3">
                        <div
                            class="text-primary flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <Mountain class="size-5" />
                        </div>
                        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">Riven</h1>
                    </div>
                </div>
            </div>

            <div class="mx-auto mb-5 w-full max-w-5xl overflow-x-auto pb-2">
                <div class="flex min-w-max items-center justify-start gap-0 px-1 md:justify-center">
                    {#each steps as step, index (step.label)}
                        <Button
                            type="button"
                            variant="ghost"
                            onclick={() => goToStep(index)}
                            class="group relative h-auto min-w-28 justify-start gap-2 rounded-none border px-3 py-3 text-left first:rounded-l-xl first:border-r-0 last:rounded-r-xl sm:min-w-33 {index ===
                            stepIndex
                                ? 'border-white/14 bg-white/6 hover:bg-white/6'
                                : index < stepIndex
                                  ? 'bg-background/40 hover:bg-background/55 border-white/12'
                                  : 'bg-background/20 hover:bg-background/30 border-white/10'}">
                            <span
                                class="flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold {index ===
                                stepIndex
                                    ? 'text-foreground border-white/16 bg-white/10'
                                    : index < stepIndex
                                      ? 'text-foreground border-white/14 bg-white/6'
                                      : 'text-muted-foreground border-white/10'}">
                                {index + 1}
                            </span>
                            <span class="truncate pr-1 text-sm font-medium">{step.label}</span>
                        </Button>
                    {/each}
                </div>
            </div>

            <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col">
                <Card.Root
                    class="bg-card/90 border-border/40 flex min-h-0 flex-1 rounded-3xl border py-0 shadow-lg">
                    <Card.Header class="px-5 py-5 sm:px-6 md:px-10 md:py-6">
                        <div class="max-w-3xl">
                            <h2 class="text-3xl font-semibold tracking-tight md:text-4xl">
                                {currentStep.label}
                            </h2>
                            <p class="text-muted-foreground mt-2 text-sm md:text-base">
                                {currentStep.description}
                            </p>
                        </div>
                    </Card.Header>

                    <Separator class="opacity-60" />

                    <Card.Content class="min-h-0 flex-1 px-5 py-6 sm:px-6 md:px-10 md:py-10">
                        {@render children()}
                    </Card.Content>

                    <Separator class="opacity-60" />

                    <Card.Footer class="px-5 py-4 sm:px-6 md:px-10 md:py-5">
                        <div
                            class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={stepIndex === 0}
                                onclick={previousStep}>
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={stepIndex === steps.length - 1}
                                onclick={nextStep}>
                                Next
                            </Button>
                        </div>
                    </Card.Footer>
                </Card.Root>
            </div>
        </div>
    </div>
</div>
