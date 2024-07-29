<script lang="ts">
  import ExpanderRowInfo from './expandable-row-info.svelte';

  export let item: any;
  export let onRemove: (imdb_id: string) => void;
  export let onExpand: (imdb_id: string) => void;
  export let alwaysOpen: boolean = false;

  let isOpen = alwaysOpen;
  let selectedItem: any = null;

  function handleRemove() {
        onRemove(item.imdb_id);
        isOpen = false; // Close the expander row
    }

    function toggleItem() {
        isOpen = !isOpen;
    }

</script>

<div class="w-full">
  <button class="group transition-colors duration-300 hover:text-gray-600 w-full flex flex-col p-4 border-b border-gray-300 cursor-pointer" on:click={toggleItem} type="button" aria-pressed={isOpen ? 'true' : 'false'}>
      {item.title}
      <div class="flex justify-between items-center w-full">
          {#if isOpen}
          <div class="border-t border-gray-300 mb-4 w-full mt-4">
              <ExpanderRowInfo {item} onExpand={onExpand} onRemove={handleRemove} />
          </div>
          {/if}
      </div>
  </button>
</div>

<style>
  .loading-animation {
      /* Add your loading animation styles here */
      font-size: 1.5em;
      text-align: center;
      margin-top: 20px;
  }
  .remove-button {
      cursor: pointer;
  }
</style>