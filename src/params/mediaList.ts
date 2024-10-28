import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is 'popular' | 'trending' => {
	return param === 'popular' || param === 'trending';
}) satisfies ParamMatcher;
