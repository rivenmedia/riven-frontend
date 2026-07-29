<script lang="ts">
    import SettingFieldEditor from "./setting-field-editor.svelte";
    import type { SettingFieldDef } from "./types";

    let {
        field,
        general = $bindable()
    }: {
        field: SettingFieldDef;
        general: Record<string, unknown>;
    } = $props();
</script>

<SettingFieldEditor {field} bind:value={general[field.key]} />
