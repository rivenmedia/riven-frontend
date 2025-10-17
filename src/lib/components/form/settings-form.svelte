<script lang="ts">
    import { type SuperValidated, superForm } from "sveltekit-superforms";
    import { zAppModel, type AppModelZodType } from "$lib/api/zod.gen";
    import { zodClient } from "sveltekit-superforms/adapters";
    import SuperDebug from "sveltekit-superforms/SuperDebug.svelte";
    import { dev } from "$app/environment";
    import FormGenerator from "$lib/components/form/FormGenerator.svelte";
    import FormField from "$lib/components/form/FormField.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import { z } from "zod";

    let { data }: { data: { form: SuperValidated<AppModelZodType> } } = $props();
    $inspect(data);

    const form = superForm(data.form, {
        dataType: "json",
        validators: zodClient(zAppModel),
        onUpdated({ form }) {
            if (form.valid) {
                // Handle successful update
                console.log("Form is valid!");
            }
        }
    });

    const { form: formData, enhance } = form;

    // Define categories based on zAppModel structure
    type Category = {
        id: string;
        label: string;
        schema?: z.ZodTypeAny;
        isRootFields?: boolean;
    };

    // Dynamically extract categories from schema
    const categories: Category[] = (() => {
        const cats: Category[] = [];
        const rootFields: string[] = [];

        // Iterate through zAppModel shape
        for (const [key, fieldSchema] of Object.entries(zAppModel.shape)) {
            const unwrapped = unwrapSchema(fieldSchema as z.ZodTypeAny);

            // If it's an object, it's a category
            if (unwrapped instanceof z.ZodObject) {
                cats.push({
                    id: key,
                    label: formatLabel(key),
                    schema: fieldSchema as z.ZodTypeAny
                });
            } else {
                // Otherwise, it's a root field
                rootFields.push(key);
            }
        }

        // Add "General" category at the beginning if there are root fields
        if (rootFields.length > 0) {
            cats.unshift({
                id: "general",
                label: "General",
                isRootFields: true
            });
        }

        return cats;
    })();

    // Extract root fields dynamically
    const rootFields = Object.entries(zAppModel.shape)
        .filter(([_, fieldSchema]) => {
            const unwrapped = unwrapSchema(fieldSchema as z.ZodTypeAny);
            return !(unwrapped instanceof z.ZodObject);
        })
        .map(([key]) => key);

    let activeCategory = $state(categories[0]?.id || "general");

    // Convert camelCase to Title Case
    function formatLabel(key: string): string {
        return key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    }

    function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
        if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
            return unwrapSchema(schema._def.innerType);
        }
        return schema;
    }
</script>

<div class="h-full w-full p-6 md:p-8 md:px-16">
    <h1 class="mb-8 text-3xl font-bold tracking-tight">Backend Settings</h1>

    <form method="POST" use:enhance class="space-y-8">
        <!-- Mobile: Dropdown category selector -->
        <div class="mb-6 md:hidden">
            <Select.Root type="single" bind:value={activeCategory}>
                <Select.Trigger class="w-full">
                    {categories.find((c) => c.id === activeCategory)?.label || "Select a category"}
                </Select.Trigger>
                <Select.Content>
                    {#each categories as category}
                        <Select.Item value={category.id}>{category.label}</Select.Item>
                    {/each}
                </Select.Content>
            </Select.Root>
        </div>

        <!-- Desktop: Two-column layout with tabs -->
        <div class="flex flex-col gap-6 md:flex-row">
            <!-- Left sidebar: Category tabs (desktop only) -->
            <Tabs.Root
                value={activeCategory}
                onValueChange={(v) => v && (activeCategory = v)}
                class="hidden flex-shrink-0 md:block md:w-64">
                <Tabs.List class="flex h-auto flex-col space-y-1 bg-transparent">
                    {#each categories as category}
                        <Tabs.Trigger
                            value={category.id}
                            class="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground w-full justify-start px-4 py-3 text-left">
                            {category.label}
                        </Tabs.Trigger>
                    {/each}
                </Tabs.List>
            </Tabs.Root>

            <!-- Right content area: Settings for selected category -->
            <div class="min-w-0 flex-1">
                {#key activeCategory}
                    <div class="space-y-6">
                        {#if activeCategory === "general"}
                            <!-- General category: Root-level fields -->
                            {#each rootFields as fieldKey}
                                {@const fieldSchema = zAppModel.shape[fieldKey]}
                                {#if fieldSchema}
                                    <FormField
                                        key={fieldKey}
                                        schema={fieldSchema}
                                        {form}
                                        path={fieldKey}
                                        label={formatLabel(fieldKey)} />
                                {/if}
                            {/each}
                        {:else}
                            <!-- Other categories: Nested object fields -->
                            {@const category = categories.find((c) => c.id === activeCategory)}
                            {#if category?.schema}
                                {@const unwrappedSchema = unwrapSchema(category.schema)}
                                {#if unwrappedSchema instanceof z.ZodObject}
                                    {#each Object.entries(unwrappedSchema.shape) as [key, fieldSchema]}
                                        <FormField
                                            {key}
                                            schema={fieldSchema}
                                            {form}
                                            path={`${activeCategory}.${key}`}
                                            label={formatLabel(key)} />
                                    {/each}
                                {/if}
                            {/if}
                        {/if}
                    </div>
                {/key}

                <div class="mt-8 flex justify-end">
                    <Button type="submit" class="px-6 py-2">Save Settings</Button>
                </div>
            </div>
        </div>
    </form>

    {#if dev}
        <SuperDebug
            display={true}
            label="Backend Settings Debug"
            data={$formData}
            collapsible
            collapsed
            theme="vscode" />
    {/if}
</div>
