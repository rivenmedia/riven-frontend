<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/header.svelte';
</script>

<Header />

<div class="mt-32 flex h-full w-full flex-col items-center justify-center font-primary">
	<h1 class="text-center text-3xl">Something went wrong</h1>
	<p class="text-base text-muted-foreground">Error code: {$page.status}</p>
	<p class="text-sm text-muted-foreground">Error message: {$page.error?.message}</p>
</div>
