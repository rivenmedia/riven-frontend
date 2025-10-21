<script lang="ts">
    import type { PageProps } from "./$types";
    import * as Empty from "$lib/components/ui/empty/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Library from "@lucide/svelte/icons/library";
    import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";

    let { data }: PageProps = $props();
</script>

<Empty.Root class="mt-14 p-8 md:px-24">
    <Empty.Header>
        <Empty.Media variant="icon">
            <Library />
        </Empty.Media>
        <Empty.Title>Nothing Here</Empty.Title>
        <Empty.Description>In progress.....</Empty.Description>
    </Empty.Header>
    <Button variant="link" class="text-muted-foreground" size="sm">
        <a href="https://github.com/rivenmedia/riven-frontend">
            Visit github repo <ArrowUpRight class="inline" />
        </a>
    </Button>
</Empty.Root>
