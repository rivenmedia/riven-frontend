<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';
  import { FormField, FormLabel, FormFieldErrors, FormControl } from '$lib/components/ui/form';
  import { Input } from '$lib/components/ui/input';

  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
  }

  let { path, form, label, isOptional }: Props = $props();

  const { value } = formFieldProxy(form, path);
</script>

<FormField {form} name={path}>
  {#snippet children({ constraints, errors })}
    <FormControl>
      {#snippet children({ props })}
        <FormLabel>
          {label}
          {#if !isOptional}
            <span class="text-red-500">*</span>
          {/if}
        </FormLabel>
        <Input type="text" {...props} {...constraints} bind:value={$value} />
      {/snippet}
    </FormControl>
    <FormFieldErrors />
  {/snippet}
</FormField>
