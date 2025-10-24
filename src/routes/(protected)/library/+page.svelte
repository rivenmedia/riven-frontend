<script lang="ts">
    import type { PageProps } from "./$types";
    import * as Form from "$lib/components/ui/form/index.js";
    import type { SuperValidated, Infer } from "sveltekit-superforms";
    import { superForm } from "sveltekit-superforms";
    import { zod4Client } from "sveltekit-superforms/adapters";
    import { Input } from "$lib/components/ui/input/index.js";
    import { toast } from "svelte-sonner";
    import LoaderCircle from "@lucide/svelte/icons/loader-circle";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import ListItem from "$lib/components/list-item.svelte";
    import { itemsSearchSchema, type ItemsSearchSchema } from "$lib/schemas/items";

    let { data }: PageProps = $props();

    const form = superForm(data.itemsSearchForm, {
        validators: zod4Client(itemsSearchSchema)
    });

    const { form: formData, enhance, message, delayed } = form;

    $inspect(data);

    $effect(() => {
        if ($message) {
            if (page.status >= 200 && page.status < 300) {
                toast.success($message);
            } else {
                toast.error($message);
            }
        }
    });
</script>

<div class="mt-14 flex h-full flex-col p-6 md:p-8 md:px-16">
    {#if data.items && data.items.length > 0}
        <div
            class="flex flex-wrap gap-2">
            {#each data.items as item}
                <ListItem data={item} indexer={item.indexer} type={item.type} />
            {/each}
        </div>
    {:else}
        <div class="flex flex-1 items-center justify-center">
            <p class="text-muted-foreground text-lg">No items found in your library</p>
        </div>
    {/if}
</div>
