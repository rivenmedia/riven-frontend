<script lang="ts">
  import { type SuperValidated, type Infer, superForm } from "sveltekit-superforms";
  import { zAppModel, type AppModelZodType } from "$lib/api/zod.gen";
  import { zodClient } from "sveltekit-superforms/adapters";
  import SuperDebug from "sveltekit-superforms/SuperDebug.svelte";
  import { dev } from "$app/environment";
  import FormGenerator from "$lib/components/form/FormGenerator.svelte";
  
  let { data }: { data: { form: SuperValidated<AppModelZodType> } } = $props();
  
  const form = superForm(data.form, {
    dataType: "json",
    validators: zodClient(zAppModel),
    onUpdated({ form }) {
      if (form.valid) {
        // Handle successful update
        console.log('Form is valid!');
      }
    }
  });
  
  const { form: formData, enhance, errors } = form;
</script>

<div class="h-full w-full p-6 md:p-8 md:px-16">
  <h1 class="mb-8 text-3xl font-bold tracking-tight">Backend Settings</h1>
  
  <form method="POST" use:enhance class="space-y-8 max-w-4xl">
    <FormGenerator schema={zAppModel} {form} />
    
    <div class="flex items-center justify-between border-t pt-6">
      <button
        type="submit"
        class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Save Changes
      </button>
      
      <button
        type="button"
        class="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Cancel
      </button>
    </div>
  </form>
  
  {#if dev}
    <SuperDebug
      display={true}
      label="Backend Settings Debug"
      data={$formData}
      collapsible
      collapsed
      theme="vscode" 
    />
  {/if}
</div>

<style>
  .form-control {
    @apply space-y-1;
  }
  
  .form-field {
    @apply rounded-lg border border-gray-200 p-4 bg-white;
  }
  
  input[type="text"],
  input[type="number"],
  select {
    @apply px-3 py-2;
  }
</style>