<script lang="ts">
    import type { PageData } from "./$types";
    let { data }: { data: PageData } = $props();

    $inspect(data);
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<div class="mt-14"></div>
