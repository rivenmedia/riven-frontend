<script lang="ts">
  import { type ZodTypeAny, z } from 'zod';
  import { type SuperForm } from 'sveltekit-superforms';
  import StringField from './fields/StringField.svelte';
  import NumberField from './fields/NumberField.svelte';
  import BooleanField from './fields/BooleanField.svelte';
  import EnumField from './fields/EnumField.svelte';
  import ObjectField from './fields/ObjectField.svelte';
  import ArrayField from './fields/ArrayField.svelte';
  
  interface Props {
    key: string;
    schema: ZodTypeAny;
    form: SuperForm<any>;
    path: string;
    label: string;
  }
  
  let { key, schema, form, path, label }: Props = $props();
  
  // Unwrap optional schemas
  function unwrapSchema(schema: ZodTypeAny): ZodTypeAny {
    if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
      return unwrapSchema(schema._def.innerType);
    }
    return schema;
  }
  
  const innerSchema = unwrapSchema(schema);
  const isOptional = schema instanceof z.ZodOptional;
  const hasDefault = schema instanceof z.ZodDefault;
  
  // Determine the field type
  const fieldType = $derived(() => {
    if (innerSchema instanceof z.ZodString) return 'string';
    if (innerSchema instanceof z.ZodNumber) return 'number';
    if (innerSchema instanceof z.ZodBoolean) return 'boolean';
    if (innerSchema instanceof z.ZodEnum || innerSchema instanceof z.ZodNativeEnum) return 'enum';
    if (innerSchema instanceof z.ZodObject) return 'object';
    if (innerSchema instanceof z.ZodArray) return 'array';
    return 'unknown';
  });
</script>

<div class="field-wrapper">
  {#if fieldType() === 'string'}
    <StringField {path} {form} {label} {isOptional} />
  {:else if fieldType() === 'number'}
    <NumberField {path} {form} {label} {isOptional} />
  {:else if fieldType() === 'boolean'}
    <BooleanField {path} {form} {label} {isOptional} />
  {:else if fieldType() === 'enum'}
    <EnumField {path} {form} {label} {isOptional} schema={innerSchema as z.ZodEnum<any>} />
  {:else if fieldType() === 'object'}
    <ObjectField {path} {form} {label} {isOptional} schema={innerSchema} />
  {:else if fieldType() === 'array'}
    <ArrayField {path} {form} {label} {isOptional} schema={innerSchema} />
  {:else}
    <div class="text-sm text-gray-500">Unsupported field type for {label}</div>
  {/if}
</div>