<script lang="ts">
    import type { PageProps } from "./$types";
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

    let { data }: PageProps = $props();

    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema),
        resetForm: false
    });

    const { form: formData, enhance, message, delayed } = form;

    $inspect(data);
</script>

<div class="mt-14 flex h-full flex-col gap-4 p-6 md:p-8 md:px-16">
    {#if dev}
        <div class="h-full">
            <SuperDebug data={$formData} />
        </div>
    {/if}

    <form class="flex flex-col" method="GET">
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

        <div class="mt-2 flex items-center gap-2">
            <Form.Field {form} name="type">
                <Form.Control>
                    {#snippet children({ props })}
                        <Select.Root type="multiple" bind:value={$formData.type} name={props.name}>
                            <Select.Trigger {...props}>
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

            <Form.Field {form} name="states">
                <Form.Control>
                    {#snippet children({ props })}
                        <Select.Root
                            type="multiple"
                            bind:value={$formData.states}
                            name={props.name}>
                            <Select.Trigger {...props}>
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
                    form.reset();
                }}>
                {#if $delayed}
                    <LoaderCircle class="mr-0.5 h-5 w-5 animate-spin" />
                {:else}
                    <Trash class="mr-0.5 inline h-5 w-5" />
                {/if}
                Clear Form
            </Form.Button>
        </div>
    </form>

    {#if data.items && data.items.length > 0}
        <div class="mt-8 flex flex-wrap gap-2">
            {#each data.items as item (item.id)}
                <ListItem data={item} indexer={item.indexer} type={item.type} />
            {/each}
        </div>
    {:else}
        <div class="flex flex-1 items-center justify-center">
            <p class="text-muted-foreground text-lg">No items found in your library</p>
        </div>
    {/if}
</div>
