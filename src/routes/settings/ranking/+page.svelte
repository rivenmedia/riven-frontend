<script lang="ts">
	// import type { PageData } from './$types';
	// import ScrapersForm from '$lib/forms/scrapers-form.svelte';

	// export let data: PageData;
</script>

<div class="flex flex-col">
	<h2 class="text-xl font-medium md:text-2xl">Ranking Settings</h2>
	<p class="text-sm text-muted-foreground md:text-base">Configure ranking settings for Riven</p>

	<div class="mt-8 flex flex-col items-start gap-2">
		<p class="text-sm lg:text-base">
			Ranking is currently only available through settings.json file
		</p>
		<p class="text-sm lg:text-base">It looks like this:</p>

		<pre class="w-full rounded-md p-4 font-mono text-sm">
{JSON.stringify(
				{
					ranking: {
						profile: 'default',
						require: [],
						exclude: [],
						preferred: [],
						custom_ranks: {
							uhd: {
								enable: false,
								fetch: false,
								rank: 120
							}
						}
					}
				},
				null,
				2
			)}
        </pre>

		<h3 class="text-base font-bold lg:text-lg">There are 7 profile in ranking:</h3>
		<ul class="list-disc pl-4">
			<li>default - The default ranking model.</li>
			<li>remux - The ranking model for the best remux.</li>
			<li>web - The ranking model for the best web release.</li>
			<li>resolution - The ranking model for the best resolution.</li>
			<li>overall - The ranking model for the best overall quality.</li>
			<li>anime - The ranking model for anime releases.</li>
			<li>all - The ranking model for all releases.</li>
		</ul>

		<h3 class="mt-4 text-base font-bold lg:text-lg">What are require, exclude and preferred?</h3>
		<p class="text-sm lg:text-base">
			These are array of regex patterns that are used to filter the releases. Example:
		</p>

		<pre class="w-full rounded-md p-4 font-mono text-sm">

{JSON.stringify(
				{
					exclude: [
						'\\bupscaled?\\b',
						'^(?!.*2160p.*1080p).*$',
						'\\bmatte\\b',
						'\\bcamrp\\b',
						'\\bwebrip\\b',
						'\\bweb-dl\\b',
						'\\bwebhd\\b',
						'\\bweb\\b',
						'\\bhdrip\\b'
					]
				},
				null,
				2
			)}
        </pre>

		<h3 class="mt-4 text-base font-bold lg:text-lg">
			What is enable, fetch and rank in custom_ranks?
		</h3>
		<p class="text-sm lg:text-base">fetch means if you want to grab it or not when its scraped</p>
		<p class="text-sm lg:text-base">
			enable just means you can set your own rank instead of using the internal ranking system from
			the profile name you specify
		</p>
		<p class="text-sm lg:text-base">rank is the priority of the custom rank</p>
	</div>

	<!-- <ScrapersForm data={data.form} actionUrl="/settings/scrapers" /> -->
</div>
