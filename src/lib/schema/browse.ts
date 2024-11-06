import { z } from 'zod';

export const schema = z.object({
	state: z
		.array(
			z.enum([
				'All',
				'Unknown',
				'Unreleased',
				'Ongoing',
				'Requested',
				'Indexed',
				'Scraped',
				'Downloaded',
				'Symlinked',
				'Completed',
				'PartiallyCompleted',
				'Failed'
			])
		)
		.default(['All']),
	type: z.array(z.enum(['movie', 'show'])).default(['movie', 'show']),
	sort: z.enum(['date_desc', 'date_asc', 'title_asc', 'title_desc']).default('date_desc')
});

export const states = {
	All: 'Any State',
	Unknown: 'Unknown',
	Unreleased: 'Unreleased',
	Ongoing: 'Ongoing',
	Requested: 'Requested',
	Indexed: 'Indexed',
	Scraped: 'Scraped',
	Downloaded: 'Downloaded',
	Symlinked: 'Symlinked',
	Completed: 'Completed',
	PartiallyCompleted: 'Partially Completed',
	Failed: 'Failed'
};

export const types = {
	movie: 'Movies',
	show: 'Shows'
};

export const sortOptions = {
	date_desc: 'Date (Newest)',
	date_asc: 'Date (Oldest)',
	title_asc: 'Title (A-Z)',
	title_desc: 'Title (Z-A)'
};

export type FormSchema = typeof schema;
