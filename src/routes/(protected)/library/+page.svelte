<script lang="ts">
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
    import SuperDebug from "sveltekit-superforms";
    import Search from "@lucide/svelte/icons/search";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import Columns2 from "@lucide/svelte/icons/columns-2";
    import Hash from "@lucide/svelte/icons/hash";
    import TV from "@lucide/svelte/icons/tv";
    import ListChecks from "@lucide/svelte/icons/list-checks";
    import * as Select from "$lib/components/ui/select/index.js";
    import ArrowUpDown from "@lucide/svelte/icons/arrow-up-down";
    import { ItemStore } from "$lib/stores/library-items.svelte";
    import { removeItem, resetItems, retryItems, pauseItems, unpauseItems } from "$lib/api";
    import * as Pagination from "$lib/components/ui/pagination/index.js";
    import Loading2Circle from "@lucide/svelte/icons/loader-2";
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";

    let { data }: PageProps = $props();

    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema),
        resetForm: false
    });

    const { form: formData, enhance, message, delayed } = form;

    const itemsStore = new ItemStore();

    $inspect(itemsStore.items);
    $inspect(data);

    let actionInProgress = $state(false);
</script>

<div class="mt-14 flex h-full flex-col gap-4 p-6 md:p-8 md:px-16">
    {#if dev}
        <div class="w-full">
            <SuperDebug data={$formData} />
        </div>
    {/if}

    <form method="GET" class="flex flex-col">
        <div class="flex flex-col">
            <Form.Field {form} name="search">
                <Form.Control>
                    {#snippet children({ props })}
                        <ButtonGroup.Root class="w-full">
                            <Input
                                placeholder="Search using title, imdb id, tmdb id, or tvdb id"
                                {...props}
                                bind:value={$formData.search} />
                            <Button variant="outline" size="icon" aria-label="Search">
                                <Search />
                            </Button>
                        </ButtonGroup.Root>
                    {/snippet}
                </Form.Control>
                <Form.FieldErrors />
            </Form.Field>

            <div class="mt-2 flex flex-col items-center gap-2 md:flex-row">
                <Form.Field {form} name="type" class="w-full md:w-auto">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.type}
                                name={props.name}>
                                <Select.Trigger {...props} class="w-full md:w-71">
                                    {$formData.type
                                        ? $formData.type.join(", ")
                                        : "Select a type to display"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each Object.keys(typeOptions) as option}
                                        <Select.Item value={option} label={option} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>

                <Form.Field {form} name="states" class="w-full md:w-auto">
                    <Form.Control>
                        {#snippet children({ props })}
                            <Select.Root
                                type="multiple"
                                bind:value={$formData.states}
                                name={props.name}>
                                <Select.Trigger {...props} class="w-full md:w-71">
                                    {$formData.states
                                        ? $formData.states.join(", ")
                                        : "Select a state to display"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each Object.keys(stateOptions) as option}
                                        <Select.Item value={option} label={option} />
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        {/snippet}
                    </Form.Control>
                </Form.Field>
            </div>

            <div class="mt-2 flex items-center gap-2">
                <Form.Field {form} name="limit">
                    <Form.Control>
                        {#snippet children({ props })}
                            <ButtonGroup.Root class="w-full">
                                <Input type="number" {...props} bind:value={$formData.limit} />
                                <Button variant="outline" size="icon" aria-label="Search">
                                    <Hash />
                                </Button>
                            </ButtonGroup.Root>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="page">
                    <Form.Control>
                        {#snippet children({ props })}
                            <ButtonGroup.Root class="w-full">
                                <Input type="number" {...props} bind:value={$formData.page} />
                                <Button variant="outline" size="icon" aria-label="Search">
                                    <Columns2 />
                                </Button>
                            </ButtonGroup.Root>
                        {/snippet}
                    </Form.Control>
                    <Form.FieldErrors />
                </Form.Field>
            </div>

            <div class="mt-2 flex items-center gap-2">
                <Form.Button variant="secondary" size="sm" disabled={$delayed}>
                    {#if $delayed}
                        <LoaderCircle class="mr-0.5 h-5 w-5 animate-spin" />
                    {:else}
                        <Search class="mr-0.5 inline h-5 w-5" />
                    {/if}
                    Search Items
                </Form.Button>

                <div class="flex"></div>

                <Form.Button
                    variant="destructive"
                    size="sm"
                    disabled={$delayed}
                    type="reset"
                    onclick={() => {
                        goto("/library", { invalidateAll: true });
                    }}>
                    {#if $delayed}
                        <LoaderCircle class="mr-0.5 h-5 w-5 animate-spin" />
                    {:else}
                        <Trash class="mr-0.5 inline h-5 w-5" />
                    {/if}
                    Clear Form
                </Form.Button>
            </div>
        </div>

        {#if itemsStore && itemsStore.count > 0}
            <p class="text-muted-foreground text-sm">
                {itemsStore.count} item{itemsStore.count === 1 ? "" : "s"} selected
            </p>

            <div transition:fly class="flex gap-2">
                {#snippet actionButton(
                    label: string,
                    variant: "destructive" | "outline",
                    action: () => Promise<void>
                )}
                    <Button
                        {variant}
                        disabled={actionInProgress}
                        size="sm"
                        onclick={async () => {
                            await action();
                        }}>
                        {#if actionInProgress}
                            <Loading2Circle class="mr-0.5 h-5 w-5 animate-spin" />
                        {/if}
                        {label}
                    </Button>
                {/snippet}

                {@render actionButton("Remove Selected", "destructive", async () => {
                    actionInProgress = true;
                    const data = await removeItem({
                        query: {
                            ids: itemsStore.items.join(",")
                        }
                    });
                    if (data.error) {
                        toast.error(`Failed to remove items: ${data.error}`);
                    } else {
                        toast.success(
                            `Successfully removed ${itemsStore.count} item${itemsStore.count === 1 ? "" : "s"}`
                        );
                        itemsStore.clear();
                    }
                    actionInProgress = false;
                })}

                {@render actionButton("Reset Selected", "outline", async () => {
                    actionInProgress = true;
                    const data = await resetItems({
                        query: {
                            ids: itemsStore.items.join(",")
                        }
                    });
                    if (data.error) {
                        toast.error(`Failed to reset items: ${data.error}`);
                    } else {
                        toast.success(
                            `Successfully reset ${itemsStore.count} item${itemsStore.count === 1 ? "" : "s"}`
                        );
                        itemsStore.clear();
                    }
                    actionInProgress = false;
                })}

                {@render actionButton("Retry Selected", "outline", async () => {
                    actionInProgress = true;
                    const data = await retryItems({
                        query: {
                            ids: itemsStore.items.join(",")
                        }
                    });
                    if (data.error) {
                        toast.error(`Failed to retry items: ${data.error}`);
                    } else {
                        toast.success(
                            `Successfully retried ${itemsStore.count} item${itemsStore.count === 1 ? "" : "s"}`
                        );
                        itemsStore.clear();
                    }
                    actionInProgress = false;
                })}

                {@render actionButton("Pause Selected", "outline", async () => {
                    actionInProgress = true;
                    const data = await pauseItems({
                        query: {
                            ids: itemsStore.items.join(",")
                        }
                    });
                    if (data.error) {
                        toast.error(`Failed to pause items: ${data.error}`);
                    } else {
                        toast.success(
                            `Successfully paused ${itemsStore.count} item${itemsStore.count === 1 ? "" : "s"}`
                        );
                        itemsStore.clear();
                    }
                    actionInProgress = false;
                })}

                {@render actionButton("Unpause Selected", "outline", async () => {
                    actionInProgress = true;
                    const data = await unpauseItems({
                        query: {
                            ids: itemsStore.items.join(",")
                        }
                    });
                    if (data.error) {
                        toast.error(`Failed to unpause items: ${data.error}`);
                    } else {
                        toast.success(
                            `Successfully unpaused ${itemsStore.count} item${itemsStore.count === 1 ? "" : "s"}`
                        );
                        itemsStore.clear();
                    }
                    actionInProgress = false;
                })}
            </div>
        {/if}

        {#if data.items && data.items.length > 0}
            <div class="mt-8 flex flex-wrap gap-2">
                {#each data.items as item (item.riven_id)}
                    <ListItem
                        data={item}
                        indexer={item.indexer}
                        type={item.type}
                        isSelectable
                        selectStore={itemsStore} />
                {/each}
            </div>

            <div class="mt-4">
                <p class="text-muted-foreground text-sm">
                    Showing page <span class="font-semibold text-purple-400">{$formData.page}</span>
                    of
                    <span class="font-semibold text-purple-400">{data.totalPages}</span> pages ({data.totalItems}
                    items total)
                </p>
            </div>

            <Pagination.Root
                count={data.totalItems}
                perPage={$formData.limit}
                bind:page={$formData.page}
                class="mt-2 pb-16">
                {#snippet children({ pages, currentPage })}
                    <Pagination.Content>
                        <Pagination.Item>
                            <Pagination.PrevButton type="submit" />
                        </Pagination.Item>
                        {#each pages as page (page.key)}
                            {#if page.type === "ellipsis"}
                                <Pagination.Item>
                                    <Pagination.Ellipsis />
                                </Pagination.Item>
                            {:else}
                                <Pagination.Item>
                                    <Pagination.Link
                                        type="submit"
                                        {page}
                                        isActive={currentPage === page.value}>
                                        {page.value}
                                    </Pagination.Link>
                                </Pagination.Item>
                            {/if}
                        {/each}
                        <Pagination.Item>
                            <Pagination.NextButton type="submit" />
                        </Pagination.Item>
                    </Pagination.Content>
                {/snippet}
            </Pagination.Root>
        {:else}
            <div class="flex flex-1 items-center justify-center">
                <p class="text-muted-foreground text-lg">No items found in your library</p>
            </div>
        {/if}
    </form>
</div>
