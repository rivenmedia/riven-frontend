<script lang="ts">
    import { tick } from "svelte";
    import type { PageProps } from "./$types";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import * as Form from "$lib/components/ui/form/index.js";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import ListItem from "$lib/components/list-item.svelte";
    import { itemsSearchSchema, typeOptions, stateOptions } from "$lib/schemas/items";
    import Trash from "@lucide/svelte/icons/trash";
    import Search from "@lucide/svelte/icons/search";
    import X from "@lucide/svelte/icons/x";
    import { Button } from "$lib/components/ui/button/index.js";
    import ListChecks from "@lucide/svelte/icons/list-checks";
    import * as Select from "$lib/components/ui/select/index.js";
    import { ItemStore } from "$lib/stores/library-items.svelte";
    import { reset_items, retry_items, remove_items } from "./library.remote";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import Loading2Circle from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import { goto, invalidateAll } from "$app/navigation";
    import { resolve } from "$app/paths";
    import PageShell from "$lib/components/page-shell.svelte";
    import { cn } from "$lib/utils";

    let { data }: PageProps = $props();

    // svelte-ignore state_referenced_locally
    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema),
        resetForm: false
    });

    const { form: formData, delayed } = form;

    const itemsStore = new ItemStore();

    let actionInProgress = $state(false);
    let formElement: HTMLFormElement;
</script>

<PageShell class="bg-background relative flex min-h-screen flex-col overflow-x-hidden">
    <!-- Immersive Background -->
    <div class="pointer-events-none fixed inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black"></div>
        <div
            class="bg-primary/5 absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]">
        </div>
        <div
            class="absolute right-[-5%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]">
        </div>
    </div>

    <div class="relative z-10 mx-auto flex w-full max-w-[2400px] flex-col gap-8">
        <!-- Header Section -->
        <header class="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div class="space-y-2">
                <h1
                    class="font-serif text-5xl font-medium tracking-tight text-white/90 md:text-7xl">
                    Library
                </h1>
                <div class="flex items-center gap-2 text-zinc-400">
                    <span class="font-mono text-xs tracking-widest uppercase">Index</span>
                    <span class="h-px w-8 bg-zinc-800"></span>
                    <span class="text-primary font-mono text-sm"
                        >{data.totalItems.toLocaleString()} items</span>
                </div>
            </div>

            <!-- Compact Filter Bar -->
            <form
                method="GET"
                bind:this={formElement}
                class="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md md:gap-3">
                <!-- Search Input -->
                <div class="group relative">
                    <Search
                        class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
                    <Form.Field {form} name="search" class="w-full space-y-0 md:w-64">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Input
                                    {...props}
                                    bind:value={$formData.search}
                                    placeholder="Search..."
                                    class="h-10 rounded-xl border-transparent bg-transparent pl-9 transition-all placeholder:text-zinc-600 hover:bg-white/5 focus:bg-white/10" />
                            {/snippet}
                        </Form.Control>
                    </Form.Field>
                </div>

                <div class="mx-1 hidden h-6 w-px bg-white/10 md:block"></div>

                <!-- Filters -->
                <Form.Field {form} name="type" class="min-w-[100px] space-y-0">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.type}
                                name={props.name}>
                                <Select.Trigger
                                    {...props}
                                    class="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-[state=open]:bg-white/10 data-[value]:text-white">
                                    {$formData.type?.length ? $formData.type.join(", ") : "Type"}
                                </Select.Trigger>
                                <Select.Content class="border-zinc-800 bg-zinc-900">
                                    {#each Object.keys(typeOptions) as option}
                                        <Select.Item value={option} label={option} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>

                <Form.Field {form} name="states" class="min-w-[100px] space-y-0">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.states}
                                name={props.name}>
                                <Select.Trigger
                                    {...props}
                                    class="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-[state=open]:bg-white/10 data-[value]:text-white">
                                    {$formData.states?.length
                                        ? $formData.states.join(", ")
                                        : "State"}
                                </Select.Trigger>
                                <Select.Content class="border-zinc-800 bg-zinc-900">
                                    {#each Object.keys(stateOptions) as option}
                                        <Select.Item value={option} label={option} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>

                <div class="mx-1 hidden h-6 w-px bg-white/10 md:block"></div>

                <!-- Submit / Clear -->
                <div class="flex items-center gap-1">
                    <Button
                        type="submit"
                        disabled={$delayed}
                        size="icon"
                        variant="ghost"
                        class="hover:bg-primary/20 hover:text-primary h-9 w-9 rounded-xl transition-colors">
                        {#if $delayed}
                            <LoaderCircle class="h-4 w-4 animate-spin" />
                        {:else}
                            <Search class="h-4 w-4" />
                        {/if}
                    </Button>
                    {#if $formData.search || $formData.type?.length || $formData.states?.length}
                        <Button
                            type="button"
                            onclick={async () =>
                                await goto(resolve("/library"), { invalidateAll: true })}
                            size="icon"
                            variant="ghost"
                            class="hover:bg-destructive/20 hover:text-destructive h-9 w-9 rounded-xl transition-colors">
                            <X class="h-4 w-4" />
                        </Button>
                    {/if}
                </div>
            </form>
        </header>

        <!-- Content Grid -->
        {#if data.totalItems > 0}
            <div
                class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {#each data.items as item, i (item.riven_id)}
                    <div
                        class="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-700"
                        style="animation-delay: {i * 30}ms">
                        <ListItem
                            data={item}
                            indexer={item.indexer}
                            type={item.type}
                            isSelectable
                            selectStore={itemsStore}
                            class="aspect-[2/3] w-full" />
                    </div>
                {/each}
            </div>

            <!-- Pagination -->
            <div class="flex justify-center pt-12 pb-24">
                <Pagination.Root
                    count={data.totalItems}
                    perPage={$formData.limit}
                    bind:page={$formData.page}>
                    {#snippet children({ pages, currentPage })}
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.PrevButton
                                    onclick={async () => {
                                        await tick();
                                        formElement.requestSubmit();
                                    }}
                                    class="border-white/10 hover:bg-white/10" />
                            </Pagination.Item>
                            {#each pages as page (page.key)}
                                {#if page.type === "ellipsis"}
                                    <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                                {:else}
                                    <Pagination.Item>
                                        <Pagination.Link
                                            {page}
                                            isActive={currentPage === page.value}
                                            onclick={async () => {
                                                await tick();
                                                formElement.requestSubmit();
                                            }}
                                            class="data-[selected]:bg-primary data-[selected]:text-primary-foreground border-transparent hover:bg-white/10">
                                            {page.value}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                {/if}
                            {/each}
                            <Pagination.Item>
                                <Pagination.NextButton
                                    onclick={async () => {
                                        await tick();
                                        formElement.requestSubmit();
                                    }}
                                    class="border-white/10 hover:bg-white/10" />
                            </Pagination.Item>
                        </Pagination.Content>
                    {/snippet}
                </Pagination.Root>
            </div>
        {:else}
            <div
                class="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
                <div
                    class="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
                    <Search class="h-10 w-10 text-zinc-600" />
                </div>
                <div>
                    <h3 class="text-xl font-medium text-white">No items found</h3>
                    <p class="mx-auto mt-2 max-w-sm text-zinc-500">
                        We couldn't find anything matching your search. Try adjusting the filters or
                        search term.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onclick={() => goto(resolve("/library"), { invalidateAll: true })}
                    class="border-white/10 hover:bg-white/5">
                    Clear all filters
                </Button>
            </div>
        {/if}

        <!-- Floating Selection Bar -->
        {#if itemsStore.count > 0}
            <div
                transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
                class="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/10 bg-zinc-900/80 p-2 pl-4 shadow-2xl backdrop-blur-xl">
                <div class="mr-4 flex items-center gap-3">
                    <div
                        class="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold">
                        {itemsStore.count}
                    </div>
                    <span class="text-sm font-medium text-zinc-300">Selected</span>
                </div>

                <div class="mx-1 h-8 w-px bg-white/10"></div>

                <div class="flex items-center gap-1">
                    {#snippet actionButton(
                        label: string,
                        icon: any,
                        onClick: () => Promise<void>,
                        variant: "default" | "destructive" = "default"
                    )}
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionInProgress}
                            onclick={onClick}
                            class={cn(
                                "h-9 gap-2 rounded-xl px-3 transition-all",
                                variant === "destructive"
                                    ? "hover:bg-red-500/20 hover:text-red-400"
                                    : "hover:bg-white/10"
                            )}>
                            {#if actionInProgress}
                                <Loading2Circle class="h-3.5 w-3.5 animate-spin" />
                            {:else}
                                <icon.component class="h-3.5 w-3.5" />
                            {/if}
                            {label}
                        </Button>
                    {/snippet}

                    <!-- Actions -->
                    {@render actionButton("Reset", { component: ListChecks }, async () => {
                        actionInProgress = true;
                        try {
                            await reset_items({ ids: itemsStore.items.map((id) => id.toString()) });
                            toast.success(`Reset ${itemsStore.count} items`);
                            itemsStore.clear();
                            await invalidateAll();
                        } catch (e) {
                            if (e instanceof Error) toast.error(`Error: ${e.message}`);
                            else toast.error("An unknown error occurred");
                        } finally {
                            actionInProgress = false;
                        }
                    })}

                    {@render actionButton("Retry", { component: Loading2Circle }, async () => {
                        actionInProgress = true;
                        try {
                            await retry_items({ ids: itemsStore.items.map((id) => id.toString()) });
                            toast.success(`Retrying ${itemsStore.count} items`);
                            itemsStore.clear();
                            await invalidateAll();
                        } catch (e) {
                            if (e instanceof Error) toast.error(`Error: ${e.message}`);
                            else toast.error("An unknown error occurred");
                        } finally {
                            actionInProgress = false;
                        }
                    })}

                    {@render actionButton(
                        "Remove",
                        { component: Trash },
                        async () => {
                            actionInProgress = true;
                            try {
                                await remove_items({
                                    ids: itemsStore.items.map((id) => id.toString())
                                });
                                toast.success(`Removed ${itemsStore.count} items`);
                                itemsStore.clear();
                                await invalidateAll();
                            } catch (e) {
                                if (e instanceof Error) toast.error(`Error: ${e.message}`);
                                else toast.error("An unknown error occurred");
                            } finally {
                                actionInProgress = false;
                            }
                        },
                        "destructive"
                    )}

                    <div class="mx-1 h-8 w-px bg-white/10"></div>

                    <Button
                        variant="ghost"
                        size="icon"
                        class="h-9 w-9 rounded-xl hover:bg-white/10"
                        onclick={() => itemsStore.clear()}>
                        <X class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        {/if}
    </div>
</PageShell>

<style>
    .fill-mode-backwards {
        animation-fill-mode: backwards;
    }
</style>
