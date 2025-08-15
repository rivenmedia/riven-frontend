import { writable } from 'svelte/store';

type MediaListState = {
	items: any[];
	currentPage: number;
	totalItems: number;
	existingIds: Set<number>;
	type: string;
	listType: string;
};

const createMediaListStore = () => {
	const initialState: Record<string, MediaListState> = {};

	const { subscribe, update, set } = writable(initialState);

	return {
		subscribe,
		initList: (type: string, listType: string) => {
			update((state) => {
				if (!state[`${type}-${listType}`]) {
					state[`${type}-${listType}`] = {
						items: [],
						currentPage: 0,
						totalItems: 0,
						existingIds: new Set(),
						type,
						listType
					};
				}
				return state;
			});
		},
		addItems: (
			type: string,
			listType: string,
			newItems: any[],
			totalResults: number,
			page: number
		) => {
			update((state) => {
				const key = `${type}-${listType}`;
				if (!state[key]) {
					state[key] = {
						items: [],
						currentPage: 0,
						totalItems: 0,
						existingIds: new Set(),
						type,
						listType
					};
				}

				const uniqueNewItems: any[] = [];

				for (const item of newItems) {
					if (!state[key].existingIds.has(item.id)) {
						uniqueNewItems.push(item);
						state[key].existingIds.add(item.id);
					}
				}

				state[key].items = [...state[key].items, ...uniqueNewItems];
				state[key].currentPage = page;
				state[key].totalItems = totalResults;

				return state;
			});
		},
		reset: () => set(initialState)
	};
};

export const mediaListStore = createMediaListStore();
