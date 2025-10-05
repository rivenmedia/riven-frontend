<script lang="ts">
    import type { PageData } from "./$types";
    import SettingsForm from "$lib/components/form/settings-form.svelte";
    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<div class="mt-14">
    <SettingsForm {data} />
</div>
