<script lang="ts">
  import { type SuperForm } from 'sveltekit-superforms';
  import { type ZodArray } from 'zod';
  
  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
    schema: ZodArray<any>;
  }
  
  let { path, form, label, isOptional, schema }: Props = $props();
  
  const { form: formData } = form;
  
  function getValue(obj: any, path: string) {
    return path.split('.').reduce((curr, part) => curr?.[part], obj);
  }
  
  function setValue(obj: any, path: string, value: any) {
    const parts = path.split('.');
    const last = parts.pop()!;
    const target = parts.reduce((curr, part) => {
      if (!curr[part]) curr[part] = {};
      return curr[part];
    }, obj);
    target[last] = value;
  }
  
  let items = $derived(getValue($formData, path) || []);
  
  function addItem() {
    const newItems = [...items, ''];
    setValue($formData, path, newItems);
  }
  
  function removeItem(index: number) {
    const newItems = items.filter((_: any, i: number) => i !== index);
    setValue($formData, path, newItems);
  }
  
  function updateItem(index: number, value: string) {
    const newItems = [...items];
    newItems[index] = value;
    setValue($formData, path, newItems);
  }
</script>

<div class="form-control">
  <div class="flex items-center justify-between mb-2">
    <label class="block text-sm font-medium text-gray-700">
      {label}
      {#if !isOptional}
        <span class="text-red-500">*</span>
      {/if}
    </label>
    <button
      type="button"
      onclick={addItem}
      class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          class="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <button
          type="button"
          onclick={() => removeItem(index)}
          class="inline-flex items-center p-1 border border-transparent rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {/each}
    
    {#if items.length === 0}
      <p class="text-sm text-gray-500">No items added</p>
    {/if}
  </div>
</div>