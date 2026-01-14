<script lang="ts">
    import { SECTION_GROUPS } from "./settings-sections";
    import { getSettingsContext } from "./settings-context";

    const store = getSettingsContext();
</script>

<div class="w-64 shrink-0 overflow-y-auto border-r p-4">
    <h2 class="mb-4 text-lg font-semibold">Settings</h2>
    <nav class="space-y-1">
        {#each SECTION_GROUPS as section (section.id)}
            <button
                type="button"
                aria-current={store.activeSection === section.id ? "page" : undefined}
                class="focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
					{store.activeSection === section.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}"
                onclick={() => store.navigateTo(section.id)}>
                <section.icon class="h-4 w-4" />
                {section.title}
            </button>
        {/each}
    </nav>
</div>
