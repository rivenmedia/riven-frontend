<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';
  import { z } from 'zod';

  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
    schema: z.ZodEnum<any> | z.ZodNativeEnum<any>;
  }

  let { path, form, label, isOptional, schema }: Props = $props();

  const { value, errors, constraints } = formFieldProxy(form, path);

  // Get enum values
  const options = $derived(() => {
    if (schema instanceof z.ZodEnum) {
      return schema.options;
    } else if (schema instanceof z.ZodNativeEnum) {
      return Object.values(schema.enum);
    }
    return [];
  });
</script>

<div class="form-control">
  <label for={path} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if !isOptional}
      <span class="text-red-500">*</span>
    {/if}
  </label>
  <select
    id={path}
    bind:value={$value}
    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    class:border-red-500={$errors}
    {...$constraints}
  >
    <option value="">Select {label.toLowerCase()}</option>
    {#each options() as option}
      <option value={option}>{option}</option>
    {/each}
  </select>
  {#if $errors}
    <p class="mt-1 text-sm text-red-600">{$errors}</p>
  {/if}
</div>