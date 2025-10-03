<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';

  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
  }

  let { path, form, label, isOptional }: Props = $props();

  const { value, errors, constraints } = formFieldProxy(form, path);
</script>

<div class="form-control">
  <label for={path} class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if !isOptional}
      <span class="text-red-500">*</span>
    {/if}
  </label>
  <input
    id={path}
    type="text"
    bind:value={$value}
    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    class:border-red-500={$errors}
    {...$constraints}
  />
  {#if $errors}
    <p class="mt-1 text-sm text-red-600">{$errors}</p>
  {/if}
</div>
