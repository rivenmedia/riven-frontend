<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount, untrack } from "svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    import { beforeNavigate, replaceState } from "$app/navigation";
    import { setShadcnContext } from "$lib/components/shadcn-context";
    import { Switch } from "$lib/components/ui/switch";
    import { SettingsStore } from "$lib/components/settings/settings-store.svelte";
    import { setSettingsContext } from "$lib/components/settings/settings-context";
    import SettingsLayout from "$lib/components/settings/settings-layout.svelte";

    setShadcnContext({ componentOverrides: { Checkbox: Switch } });

    const { data }: { data: PageData } = $props();

    // Extract initial section ID from server data (intentionally not reactive)
    const initialSectionId = untrack(() => data.currentSectionId);

    const store = new SettingsStore();
    setSettingsContext(store);

    // Set initial section after store is created (triggers auto-load via effect)
    store.setActiveSection(initialSectionId);

    // Sync URL when section changes
    let previousSection = initialSectionId;
    $effect(() => {
        const section = store.activeSection;
        // Skip if section hasn't changed (avoids initial URL rewrite)
        if (section === previousSection) return;
        previousSection = section;

        if (browser) {
            const url = new URL(page.url);
            url.searchParams.set("section", section);
            replaceState(url, {});
        }
    });

    // Native confirm() required - browser security prevents custom dialogs from blocking
    // back/forward navigation. UnsavedChangesDialog only works for in-app navigation.
    beforeNavigate(({ cancel }) => {
        if (store.hasAnyUnsavedChanges()) {
            if (!confirm("You have unsaved changes. Are you sure you want to leave?")) {
                cancel();
            }
        }
    });

    // Warn before closing tab/window or external navigation
    onMount(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (store.hasAnyUnsavedChanges()) {
                e.preventDefault();
                // Modern browsers ignore custom messages, but returnValue is still required
                e.returnValue = "";
                return "";
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    });
</script>

<svelte:head>
    <title>Settings - Riven</title>
</svelte:head>

<SettingsLayout />
