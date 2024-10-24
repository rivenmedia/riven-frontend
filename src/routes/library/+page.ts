import type { PageLoad } from './$types';
import { ItemsService, type ItemsResponse } from '$lib/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ url }) => {
	async function getLibraryApi(): Promise<ItemsResponse> {
		const limit = Number(url.searchParams.get('limit')) || 24;
		const page = Number(url.searchParams.get('page')) || 1;
		const types = url.searchParams.get('types');
		const query = url.searchParams.get('query');
		const states = url.searchParams.get('states');

		const { data, error: itemsError } = await ItemsService.getItems({
			query: {
				limit,
				page,
				states,
				type: types ?? 'movie,show',
				search: query,
				sort: 'date_desc'
			}
		});

		if (data) {
			return data;
		} else {
			console.log(itemsError);
			throw error(500, "Couldn't reach backend to get library items");
		}
	}

	const { items, total_items } = await getLibraryApi();

	return {
		library: items,
		total: total_items
	};
};
