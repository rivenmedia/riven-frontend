import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getMediaDetails } from '$lib/providers/anilist';

interface RatingScore {
	name: string;
	image?: string;
	score: number | string | null;
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	const { anilistId } = params;

	const scores: RatingScore[] = [];

	try {
		// Fetch AniList rating
		const mediaDetails = await getMediaDetails(Number(anilistId), fetch);

		if (mediaDetails?.data?.Media) {
			const { averageScore, meanScore } = mediaDetails.data.Media;

			// AniList uses a 0-100 scale, convert to 0-10
			const score = averageScore || meanScore;
			if (score) {
				scores.push({
					name: 'anilist',
					image: 'anilist.svg',
					score: Math.round(score) / 10
				});
			}
		}

		// Filter out null scores
		const validScores = scores.filter(
			(score) =>
				score.score !== null &&
				score.score !== '' &&
				score.score !== 0 &&
				score.score !== '0.0'
		);

		return json({
			scores: validScores,
			anilistId: Number(anilistId)
		});
	} catch (e) {
		console.error('AniList rating fetch error:', e);
		throw error(500, 'Failed to fetch AniList ratings');
	}
};
