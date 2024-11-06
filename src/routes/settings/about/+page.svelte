<script lang="ts">
	import type { PageData } from './$types';
	import { Separator } from '$lib/components/ui/separator';
	import { formatWords } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, MoveUpRight } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { DefaultService } from '$lib/client';

	export let data: PageData;

	const version = data.settings.version; // Backend version
	const frontendVersion = data.frontendVersion; // Frontend version passed from server
	const rclone_path = data.settings.symlink.rclone_path;
	const library_path = data.settings.symlink.library_path;

	interface AboutData {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
		rclone_path: string;
		library_path: string;
	}

	type SupportData = {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
		github: string;
		discord: string;
	};

	const aboutData: AboutData = {
		rclone_path,
		library_path
	};
	const supportData: SupportData = {
		discord: 'https://discord.gg/wDgVdH8vNM',
		github: 'https://github.com/rivenmedia/riven'
	};

	let updateLoadingBackend = false;
	let updateLoadingFrontend = false;

	// Function to check for backend updates
	async function getLatestBackendVersion() {
		updateLoadingBackend = true;
		const data = await fetch(
			'https://raw.githubusercontent.com/rivenmedia/riven/main/pyproject.toml'
		);
		if (data.status !== 200) {
			toast.error('Failed to fetch latest backend version.');
			updateLoadingBackend = false;
			return;
		}
		const remoteVersion = (await data.text()).match(/version = "(.*?)"/)?.[1];
		updateLoadingBackend = false;

		if (remoteVersion !== version) {
			toast.warning('A new backend version is available! Checkout the changelog on GitHub.');
		} else {
			toast.success('You are running the latest backend version.');
		}
	}

	// Function to check for frontend updates
	async function getLatestFrontendVersion() {
		updateLoadingFrontend = true;
		const data = await fetch(
			'https://raw.githubusercontent.com/rivenmedia/riven-frontend/main/version.txt'
		);
		if (data.status !== 200) {
			toast.error('Failed to fetch latest frontend version.');
			updateLoadingFrontend = false;
			return;
		}
		const remoteVersion = await data.text();
		updateLoadingFrontend = false;

		if (remoteVersion.trim() !== frontendVersion) {
			toast.warning('A new frontend version is available! Checkout the changelog on GitHub.');
		} else {
			toast.success('You are running the latest frontend version.');
		}
	}

	async function uploadLogs() {
		const response = await DefaultService.uploadLogs();

		if (!response.error) {
			navigator.clipboard.writeText(String(response?.data?.url));
			toast.success('Logs uploaded successfully and link copied to clipboard');
		} else {
			toast.error(`Failed to upload logs: ${response.error}`);
		}
	}
</script>

<svelte:head>
	<title>Settings | About</title>
</svelte:head>

<div class="flex flex-col">
	<h2 class="text-xl font-medium md:text-2xl">About</h2>
	<p class="text-sm text-muted-foreground md:text-base">
		Know what you're running and how to get help.
	</p>
	<div class="my-8 flex w-full flex-col gap-4">
		<div class="mb-2 flex flex-col items-start md:flex-row md:items-center">
			<h3 class="w-48 min-w-48 text-sm">Backend Version</h3>
			<div class="flex w-full flex-wrap gap-2">
				<p class="break-words rounded-md bg-secondary p-2 text-sm">
					{version}
				</p>
				<Button
					on:click={async () => {
						await getLatestBackendVersion();
					}}
					disabled={updateLoadingBackend}
					variant="outline"
					size="sm"
				>
					{#if updateLoadingBackend}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<MoveUpRight class="mr-2 h-4 w-4" />
					{/if}
					Check for Backend Updates
				</Button>
			</div>
		</div>
		<div class="mb-2 flex flex-col items-start md:flex-row md:items-center">
			<h3 class="w-48 min-w-48 text-sm">Frontend Version</h3>
			<div class="flex w-full flex-wrap gap-2">
				<p class="break-words rounded-md bg-secondary p-2 text-sm">
					{frontendVersion}
				</p>
				<Button
					on:click={async () => {
						await getLatestFrontendVersion();
					}}
					disabled={updateLoadingFrontend}
					variant="outline"
					size="sm"
				>
					{#if updateLoadingFrontend}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{:else}
						<MoveUpRight class="mr-2 h-4 w-4" />
					{/if}
					Check for Frontend Updates
				</Button>
			</div>
		</div>
		{#each Object.keys(aboutData) as key}
			<Separator />
			<div class="mb-2 flex flex-col items-start md:flex-row md:items-center">
				<h3 class="w-48 min-w-48 text-sm">
					{formatWords(key)}
				</h3>
				<div class="flex w-full">
					<p class="break-words rounded-md bg-secondary p-2 text-sm">
						{aboutData[key]}
					</p>
				</div>
			</div>
		{/each}
	</div>

	<h2 class="text-xl font-medium md:text-2xl">Support</h2>
	<p class="text-sm text-muted-foreground md:text-base">
		Need help? Reach out to the Riven community or report an issue on GitHub.
	</p>
	<div class="my-8 flex w-full flex-col gap-4">
		{#each Object.keys(supportData) as key}
			<Separator />
			<div class="mb-2 flex flex-col items-start md:flex-row md:items-center">
				<h3 class="w-48 min-w-48 text-sm">
					{formatWords(key)}
				</h3>
				<div class="flex w-full">
					<a
						target="_blank"
						rel="noopener noreferrer"
						href={supportData[key]}
						class="break-words text-sm underline"
					>
						{supportData[key]}
					</a>
				</div>
			</div>
		{/each}
		<div class="mt-2 flex">
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								type="button"
								variant="outline"
								size="sm"
								aria-label="Upload application logs"
							>
								Upload Logs
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Upload logs of upto 50MB and 180 days retention</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action will upload your recent logs to <a
								class="underline underline-offset-4"
								href="https://paste.c-net.org"
								target="_blank"
								rel="noopener noreferrer">paste.c-net.org</a
							> and provide you with a link to share with the community.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action on:click={uploadLogs}>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>

	<h2 class="text-xl font-medium md:text-2xl">Contributors</h2>
	<p class="text-sm text-muted-foreground md:text-base">
		Thanks to the following people for their contributions to Riven
	</p>
	<a
		href="https://github.com/rivenmedia/riven/graphs/contributors"
		target="_blank"
		rel="noopener noreferrer"
		class="my-8"
	>
		<img alt="contributors" src="https://contrib.rocks/image?repo=rivenmedia/riven" class="mt-2" />
	</a>
</div>
