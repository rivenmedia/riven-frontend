import { superValidate } from 'sveltekit-superforms/client';
import { schema } from '$lib/schema/browse';
import { ItemsService } from '$lib/client';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageLoad } from '../$types';
import type { RivenGetItemsResponse } from '$lib/types';

export const load = (async () => {
	const form = await superValidate({}, zod(schema));
	const page = 1;
	const limit = 12;

	async function getItems(): Promise<RivenGetItemsResponse> {
		try {
			const { data, error } = await ItemsService.getItems({
				query: {
					page,
					sort: form.data.sort,
					limit,
					type: form.data.type,
					states: form.data.state
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
