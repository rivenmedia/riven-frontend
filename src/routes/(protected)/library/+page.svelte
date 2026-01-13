<script lang="ts">
    import { tick } from "svelte";
    import type { PageProps } from "./$types";
    import { fly } from "svelte/transition";
    import * as Form from "$lib/components/ui/form/index.js";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { dev } from "$app/environment";
    import ListItem from "$lib/components/list-item.svelte";
    import { itemsSearchSchema, typeOptions, stateOptions, sortOptions } from "$lib/schemas/items";
    import Trash from "@lucide/svelte/icons/trash";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
    import RefreshCw from "@lucide/svelte/icons/refresh-cw";
    import Pause from "@lucide/svelte/icons/pause";
    import Play from "@lucide/svelte/icons/play";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import Columns2 from "@lucide/svelte/icons/columns-2";
    import Hash from "@lucide/svelte/icons/hash";
    import TV from "@lucide/svelte/icons/tv";
    import ListChecks from "@lucide/svelte/icons/list-checks";
    import * as Select from "$lib/components/ui/select/index.js";
    import ArrowUpDown from "@lucide/svelte/icons/arrow-up-down";
    import { ItemStore } from "$lib/stores/library-items.svelte";
    import providers from "$lib/providers";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import Loading2Circle from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import { goto, invalidateAll } from "$app/navigation";
    import { Skeleton } from "$lib/components/ui/skeleton";
    import { DELETE } from "../api/[...backendProxy]/+server";
    import PageShell from "$lib/components/page-shell.svelte";

    let { data }: PageProps = $props();

    // svelte-ignore state_referenced_locally
    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema),
        resetForm: false
    });

    const { form: formData, enhance, message, delayed } = form;

    const itemsStore = new ItemStore();

    let actionInProgress = $state(false);
    let formElement: HTMLFormElement;
</script>

<PageShell class="relative flex min-h-screen flex-col gap-8 overflow-x-hidden p-4 md:p-8">
    <!-- Immersive Background -->
    <div class="pointer-events-none fixed top-0 left-0 z-0 h-screen w-full">
        <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950">
        </div>
    </div>

    <div class="relative z-10 flex flex-col gap-8">
        <div class="flex items-end justify-between">
            <div class="flex flex-col gap-2">
                <h1
                    class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                    Library
                </h1>
                <p class="text-muted-foreground text-sm font-medium">
                    {data.totalItems.toLocaleString()} items
                </p>
            </div>
        </div>

        <form method="GET" class="flex flex-col gap-6" bind:this={formElement}>
            <div
                class="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
                <Form.Field {form} name="search" class="w-full space-y-0">
                    <Form.Control>
                        {#snippet children({ props })}
                            <div class="relative w-full">
                                <Search
                                    class="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                                <Input
                                    placeholder="Search library..."
                                    class="focus:border-primary/50 h-12 rounded-xl border-white/10 bg-white/5 pl-12 text-base shadow-inner backdrop-blur-md transition-all hover:bg-white/10 focus:bg-white/10"
                                    {...props}
                                    bind:value={$formData.search} />
                            </div>
                        {/snippet}
                    </Form.Control>
                </Form.Field>

                <div class="flex flex-wrap items-center gap-3">
                    <Form.Field {form} name="type" class="min-w-[140px] space-y-0">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Select.Root
                                    type="multiple"
                                    bind:value={$formData.type}
                                    name={props.name}>
                                    <Select.Trigger
                                        {...props}
                                        class="h-10 rounded-lg border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10">
                                        {$formData.type?.length
                                            ? $formData.type.join(", ")
                                            : "Type"}
                                    </Select.Trigger>
                                    <Select.Content
                                        class="bg-popover/90 rounded-xl border-white/10 backdrop-blur-xl">
                                        {#each Object.keys(typeOptions) as option}
                                            <Select.Item value={option} label={option} />
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            {/snippet}
                        </Form.Control>
                    </Form.Field>

                    <Form.Field {form} name="states" class="min-w-[140px] space-y-0">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Select.Root
                                    type="multiple"
                                    bind:value={$formData.states}
                                    name={props.name}>
                                    <Select.Trigger
                                        {...props}
                                        class="h-10 rounded-lg border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10">
                                        {$formData.states?.length
                                            ? $formData.states.join(", ")
                                            : "State"}
                                    </Select.Trigger>
                                    <Select.Content
                                        class="bg-popover/90 rounded-xl border-white/10 backdrop-blur-xl">
                                        {#each Object.keys(stateOptions) as option}
                                            <Select.Item value={option} label={option} />
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            {/snippet}
                        </Form.Control>
                    </Form.Field>

                    <Form.Field {form} name="limit" class="w-24 space-y-0">
                        <Form.Control>
                            {#snippet children({ props })}
                                <div class="relative">
                                    <Hash
                                        class="text-muted-foreground absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                                    <Input
                                        type="number"
                                        class="h-10 rounded-lg border-white/10 bg-white/5 pl-8 backdrop-blur-md transition-colors hover:bg-white/10"
                                        {...props}
                                        bind:value={$formData.limit} />
                                </div>
                            {/snippet}
                        </Form.Control>
                    </Form.Field>

                    <div class="ml-auto flex items-center gap-2">
                        <Form.Button
                            variant="secondary"
                            size="sm"
                            class="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 h-10 rounded-lg border px-6 font-medium shadow-sm backdrop-blur-md transition-all hover:scale-105"
                            disabled={$delayed}>
                            {#if $delayed}
                                <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                            {:else}
                                <Search class="mr-2 h-4 w-4" />
                            {/if}
                            Search
                        </Form.Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 rounded-lg px-4 transition-colors"
                            disabled={$delayed}
                            type="button"
                            onclick={() => {
                                goto("/library", { invalidateAll: true });
                            }}>
                            <Trash class="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {#if itemsStore && itemsStore.count > 0}
                <div
                    class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4 rounded-full border border-white/20 bg-black/40 px-6 py-3 shadow-2xl backdrop-blur-2xl"
                    transition:fly={{ y: 50, duration: 300 }}>
                    <div class="flex items-center gap-3 border-r border-white/20 pr-4">
                        <ListChecks class="text-primary h-4 w-4" />
                        <span class="text-sm font-bold text-white">
                            {itemsStore.count} selected
                        </span>
                        <button
                            class="text-muted-foreground text-xs transition-colors hover:text-white"
                            onclick={() => itemsStore.clear()}>
                            <X class="h-4 w-4" />
                        </button>
                    </div>

                    <div class="flex gap-1">
                        {#snippet actionButton(
                            label: string,
                            variant: "destructive" | "secondary" | "outline",
                            action: () => Promise<void>
                        )}
                            <Button
                                {variant}
                                disabled={actionInProgress}
                                size="sm"
                                class={variant === "destructive"
                                    ? "bg-destructive/20 text-destructive hover:bg-destructive/30 border-0"
                                    : "border-0 bg-white/10 text-white hover:bg-white/20"}
                                onclick={async () => {
                                    await action();
                                }}>
                                {#if actionInProgress}
                                    <Loading2Circle class="mr-2 h-4 w-4 animate-spin" />
                                {/if}
                                {label}
                            </Button>
                        {/snippet}

                        {@render actionButton("Remove", "destructive", async () => {
                            actionInProgress = true;
                            try {
                                const data = await providers.riven.DELETE("/api/v1/items/remove", {
                                    body: { ids: itemsStore.items.map((id) => id.toString()) }
                                });
                                if (data.error) toast.error(`Failed: ${data.error}`);
                                else {
                                    toast.success(`Removed ${itemsStore.count} items`);
                                    itemsStore.clear();
                                    await invalidateAll();
                                }
                            } finally {
                                actionInProgress = false;
                            }
                        })}

                        {@render actionButton("Reset", "secondary", async () => {
                            actionInProgress = true;
                            try {
                                const data = await providers.riven.POST("/api/v1/items/reset", {
                                    body: { ids: itemsStore.items.map((id) => id.toString()) }
                                });
                                if (data.error) toast.error(`Failed: ${data.error}`);
                                else {
                                    toast.success(`Reset ${itemsStore.count} items`);
                                    itemsStore.clear();
                                    await invalidateAll();
                                }
                            } finally {
                                actionInProgress = false;
                            }
                        })}

                        {@render actionButton("Retry", "secondary", async () => {
                            actionInProgress = true;
                            try {
                                const data = await providers.riven.POST("/api/v1/items/retry", {
                                    body: { ids: itemsStore.items.map((id) => id.toString()) }
                                });
                                if (data.error) toast.error(`Failed: ${data.error}`);
                                else {
                                    toast.success(`Retried ${itemsStore.count} items`);
                                    itemsStore.clear();
                                    await invalidateAll();
                                }
                            } finally {
                                actionInProgress = false;
                            }
                        })}
                    </div>
                </div>
            {/if}

            {#if data.totalItems > 0}
                <div
                    class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {#each data.items as item (item.riven_id)}
                        <ListItem
                            data={item}
                            indexer={item.indexer}
                            type={item.type}
                            isSelectable
                            selectStore={itemsStore} />
                    {/each}
                </div>

                <div class="mt-8 flex flex-col items-center gap-4 pb-16">
                    <p class="text-muted-foreground text-sm">
                        Page <span class="text-primary font-mono">{data.page}</span> of
                        <span class="text-primary font-mono">{data.totalPages}</span>
                    </p>

                    <Pagination.Root
                        count={data.totalItems}
                        perPage={$formData.limit}
                        bind:page={$formData.page}
                        class="w-auto">
                        {#snippet children({ pages, currentPage })}
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.PrevButton
                                        class="border-0 bg-transparent hover:bg-white/5"
                                        onclick={async () => {
                                            await tick();
                                            formElement.requestSubmit();
                                        }} />
                                </Pagination.Item>
                                {#each pages as page (page.key)}
                                    {#if page.type === "ellipsis"}
                                        <Pagination.Item>
                                            <Pagination.Ellipsis />
                                        </Pagination.Item>
                                    {:else}
                                        <Pagination.Item>
                                            <Pagination.Link
                                                {page}
                                                isActive={currentPage === page.value}
                                                class={currentPage === page.value
                                                    ? "bg-primary/20 text-primary border-0 font-bold"
                                                    : "border-0 bg-transparent hover:bg-white/5"}
                                                onclick={async () => {
                                                    await tick();
                                                    formElement.requestSubmit();
                                                }}>
                                                {page.value}
                                            </Pagination.Link>
                                        </Pagination.Item>
                                    {/if}
                                {/each}
                                <Pagination.Item>
                                    <Pagination.NextButton
                                        class="border-0 bg-transparent hover:bg-white/5"
                                        onclick={async () => {
                                            await tick();
                                            formElement.requestSubmit();
                                        }} />
                                </Pagination.Item>
                            </Pagination.Content>
                        {/snippet}
                    </Pagination.Root>
                </div>
            {:else}
                <div class="mt-20 flex flex-col items-center justify-center gap-4 text-center">
                    <div class="rounded-full bg-white/5 p-6">
                        <Search class="text-muted-foreground/50 h-12 w-12" />
                    </div>
                    <div class="max-w-sm">
                        <h3 class="text-lg font-semibold">No items found</h3>
                        <p class="text-muted-foreground mt-1 text-sm">
                            Try adjusting your filters or search query.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        class="mt-2 border-white/10 bg-transparent hover:bg-white/5"
                        onclick={() => {
                            goto("/library", { invalidateAll: true });
                        }}>
                        Clear Filters
                    </Button>
                </div>
            {/if}
        </form>
    </div>
</PageShell>
