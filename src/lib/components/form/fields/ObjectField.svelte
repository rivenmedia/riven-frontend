<script lang="ts">
  import { type SuperForm } from 'sveltekit-superforms';
  import { type ZodObject } from 'zod';
  import FormGenerator from '../FormGenerator.svelte';
  
  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
    schema: ZodObject<any>;
  }
  
  let { path, form, label, isOptional, schema }: Props = $props();
  
  let expanded = $state(false);
</script>

<div class="form-control">
  <button
    type="button"
    onclick={() => expanded = !expanded}
    class="flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75"
  >
    <span>
      {label}
      {#if !isOptional}
        <span class="text-red-500">*</span>
      {/if}
    </span>
    <svg
      class="h-5 w-5 transform transition-transform {expanded ? 'rotate-180' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  
  {#if expanded}
    <div class="mt-4 pl-4 border-l-2 border-gray-200">
      <FormGenerator {schema} {form} {path} />
    </div>
  {/if}
</div>