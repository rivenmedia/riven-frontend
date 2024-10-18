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
						resolutions: {
							'2160p': false,
							'1080p': true,
							'720p': true,
							'480p': false,
							'360p': false,
							unknown: true
						},
						options: {
							title_similarity: 0.85,
							remove_all_trash: true,
							remove_ranks_under: -10000,
							remove_unknown_languages: false,
							allow_english_in_languages: false
						},
						languages: {
							required: [],
							exclude: ['common'],
							preferred: []
						},
						custom_ranks: {
							'...': '...'
						}
					}
				},
				null,
				2
			)}
        </pre>

		<h3 class="text-base font-bold lg:text-lg">There are 3 profile in ranking:</h3>
		<ul class="list-disc pl-4">
			<li>default - Optimized for streaming without transcoding</li>
			<li>best - Aimed at obtaining the highest quality content available</li>
			<li>custom - This is a custom profile that you can create yourself</li>
		</ul>

		<p>
			You can read more in detail about all the settings on rankings wiki <a
				class="text-blue-500 underline underline-offset-4"
				href="https://dreulavelle.github.io/rank-torrent-name/users/faq/">here</a
			>
		</p>
	</div>
</div>
