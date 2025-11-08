<script lang="ts">
    import type { ActionData, PageData } from "./$types";
    import { createMeta, SvelteKitForm } from "@sjsf/sveltekit/client";
    import * as defaults from "$lib/components/settings/form-defaults";
    import { setShadcnContext } from "$lib/components/shadcn-context";
    import { toast } from "svelte-sonner";
    import { icons } from "@sjsf/lucide-icons";
    setShadcnContext();

    let { data }: { data: PageData } = $props();
    $inspect(data.form);

    const meta = createMeta<ActionData, PageData>().form;
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<div class="mt-14 h-full w-full p-6 md:p-8 md:px-16">
    <SvelteKitForm
        {...defaults}
        {icons}
        {meta}
        onSuccess={(result: any) => {
            if (result.type === "success") {
                toast.success("Settings saved");
            }
        }} />
</div>
