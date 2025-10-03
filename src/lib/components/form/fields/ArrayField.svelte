<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';
  import { type ZodArray } from 'zod';

  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
    schema: ZodArray<any>;
  }

  let { path, form, label, isOptional, schema }: Props = $props();

  const { value } = formFieldProxy(form, path);

  // Ensure value is initialized as an array
  $effect(() => {
    if ($value === undefined || $value === null) {
      $value = [];
    }
  });

  let items = $derived(Array.isArray($value) ? $value : []);

  function addItem() {
    $value = [...items, ''];
  }

  function removeItem(index: number) {
    $value = items.filter((_: any, i: number) => i !== index);
  }

  function updateItem(index: number, newValue: string) {
    const newItems = [...items];
    newItems[index] = newValue;
    $value = newItems;
  }
</script>

<div class="form-control">
  <div class="flex items-center justify-between mb-2">
    <label class="block text-sm font-medium">
      {label}
      {#if !isOptional}
        <span class="text-destructive">*</span>
      {/if}
    </label>
    <button
      type="button"
      onclick={addItem}
      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
    >
      Add Item
    </button>
  </div>

  <div class="space-y-2">
    {#each items as item, index}
      <div class="flex items-center space-x-2">
        <input
          type="text"
          value={item}
          oninput={(e) => updateItem(index, e.currentTarget.value)}
          class="block flex-1 rounded-md border-input bg-background shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
        />
        <button
          type="button"
          onclick={() => removeItem(index)}
          class="inline-flex items-center p-1 border border-transparent rounded-full text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/each}

    {#if items.length === 0}
      <p class="text-sm text-muted-foreground">No items added</p>
    {/if}
  </div>
</div>