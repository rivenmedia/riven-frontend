<script lang="ts">
  import { type SuperForm, formFieldProxy } from 'sveltekit-superforms';
  import { z } from 'zod';
  import { FormField, FormLabel, FormFieldErrors, FormControl } from '$lib/components/ui/form';
  import * as Select from '$lib/components/ui/select';

  interface Props {
    path: string;
    form: SuperForm<any>;
    label: string;
    isOptional: boolean;
    schema: z.ZodEnum<any> | z.ZodNativeEnum<any>;
  }

  let { path, form, label, isOptional, schema }: Props = $props();

  const { value } = formFieldProxy(form, path);

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

<FormField {form} name={path}>
  {#snippet children({ constraints })}
    <FormControl>
      {#snippet children({ props })}
        <FormLabel>
          {label}
          {#if !isOptional}
            <span class="text-red-500">*</span>
          {/if}
        </FormLabel>
        <Select.Root
          type="single"
          bind:value={$value}
          name={props.name}>
          <Select.Trigger class="w-full" {...props}>
            {$value || `Select ${label.toLowerCase()}`}
          </Select.Trigger>
          <Select.Content>
            {#each options() as option}
              <Select.Item value={option}>{option}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {/snippet}
    </FormControl>
    <FormFieldErrors />
  {/snippet}
</FormField>