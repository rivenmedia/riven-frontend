<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';
  import { FormField, FormLabel, FormFieldErrors, FormControl } from '$lib/components/ui/form';
  import { Checkbox } from '$lib/components/ui/checkbox';

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
        <div class="flex items-center gap-2">
          <Checkbox {...props} {...constraints} bind:checked={$value} />
          <FormLabel class="!mt-0">
            {label}
            {#if !isOptional}
              <span class="text-red-500">*</span>
            {/if}
          </FormLabel>
        </div>
      {/snippet}
    </FormControl>
    <FormFieldErrors />
  {/snippet}
</FormField>
