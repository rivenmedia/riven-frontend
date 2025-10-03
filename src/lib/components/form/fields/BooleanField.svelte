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
  <div class="flex items-center">
    <input
      id={path}
      type="checkbox"
      bind:checked={$value}
      class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      class:border-red-500={$errors}
    />
    <label for={path} class="ml-2 block text-sm text-gray-900">
      {label}
      {#if !isOptional}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  </div>
  {#if $errors}
    <p class="mt-1 text-sm text-red-600">{$errors}</p>
  {/if}
</div>
