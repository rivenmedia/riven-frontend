import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'movie' | 'tv' => {
	return param === 'movie' || param === 'tv';
}) satisfies ParamMatcher;
