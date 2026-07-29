<script lang="ts">
    import SetupFlow from "$lib/components/settings/setup-flow.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<SetupFlow data={data as never} />
