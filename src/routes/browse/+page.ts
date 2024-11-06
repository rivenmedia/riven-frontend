import { superValidate } from 'sveltekit-superforms/client';
import { schema } from '$lib/schema/browse';
import { ItemsService, type States } from '$lib/client';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from '../$types';
import type { RivenGetItemsResponse } from '$lib/types';

export const load = (async ({ url }) => {
	const form = await superValidate({}, zod(schema));
	let page = 1;
	const limit = 24;

	if (url.searchParams.has('page')) {
		page = parseInt(url.searchParams.get('page') as string);
	}
	if (url.searchParams.has('sort')) {
		form.data.sort = url.searchParams.get('sort') as
			| 'date_desc'
			| 'date_asc'
			| 'title_asc'
			| 'title_desc';
	}
	if (url.searchParams.has('type')) {
		form.data.type = url.searchParams.get('type')?.split(',') as ['movie', 'show'];
	}
	if (url.searchParams.has('state')) {
		form.data.state = url.searchParams.get('state')?.split(',') as States[];
	} else {
		form.data.state = ['All'];
	}

	async function getItems(): Promise<RivenGetItemsResponse> {
		try {
			const { data, error } = await ItemsService.getItems({
				query: {
					page,
					sort: form.data.sort,
					limit,
					type: form.data.type.join(','),
					states: form.data.state.join(',')
				}
			});

			if (error) {
				console.error('Error fetching items:', error);
				return { success: true, items: [], page: 0, limit: 0, total_items: 0, total_pages: 0 };
			}

			return data as unknown as RivenGetItemsResponse;
		} catch (err) {
			console.error('Error in getItems:', err);
			return { success: true, items: [], page: 0, limit: 0, total_items: 0, total_pages: 0 };
		}
	}

	const itemsData = await getItems();

	return {
		form,
		page,
		itemsData
	};
}) satisfies PageLoad;
