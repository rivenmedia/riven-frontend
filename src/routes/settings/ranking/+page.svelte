<script lang="ts">
	import type { PageData } from './$types';
	import RankingForm from '$lib/forms/ranking-form.svelte';

	export let data: PageData;
</script>

<div class="flex flex-col">
	<h2 class="text-xl font-medium md:text-2xl">Ranking Settings</h2>
	<p class="text-sm text-muted-foreground md:text-base">Configure ranking settings for Riven.</p>

	<RankingForm data={data.form} actionUrl="/settings/ranking" />
</div>
