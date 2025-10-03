<script lang="ts">
  import { type ZodObject, type ZodTypeAny, z } from 'zod';
  import { type SuperForm } from 'sveltekit-superforms';
  import FormField from './FormField.svelte';
  
  interface Props {
    schema: ZodObject<any>;
    form: SuperForm<any>;
    path?: string;
  }
  
  let { schema, form, path = '' }: Props = $props();
  
  const { form: formData } = form;
  
  // Get the shape of the schema
  const shape = schema.shape;
  
  // Convert camelCase to Title Case
  function formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
</script>

<div class="space-y-6">
  {#each Object.entries(shape) as [key, fieldSchema]}
    <div class="form-field">
      <FormField
        {key}
        schema={fieldSchema}
        {form}
        path={path ? `${path}.${key}` : key}
        label={formatLabel(key)}
      />
    </div>
  {/each}
</div>