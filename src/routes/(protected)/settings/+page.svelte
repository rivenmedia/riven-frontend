<script lang="ts">
    import type { PageData } from "./$types";
    import SettingsForm from "$lib/components/form/settings-form.svelte";
    let { data }: { data: PageData } = $props();
</script>

<SettingsForm {data} />
