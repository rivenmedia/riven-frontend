import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import providers from '$lib/providers';
import { env } from '$env/dynamic/private';

interface RatingScore {
	name: string;
	image?: string;
	score: number | string | null;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const { tmdbId } = params;
	const mediaType = url.searchParams.get('type') as 'movie' | 'tv' | null;

	if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
		throw error(400, 'Invalid or missing media type. Must be "movie" or "tv"');
	}

	const scores: RatingScore[] = [];

	try {
		// 1. TMDB Rating
		try {
			if (mediaType === 'movie') {
				const movieData = await providers.tmdb.GET('/3/movie/{movie_id}', {
					params: {
						path: {
							movie_id: Number(tmdbId)
						}
					}
				});

				if (movieData.data?.vote_average) {
					scores.push({
						name: 'tmdb',
						image: 'tmdb.png',
						score: Math.round(movieData.data.vote_average * 10) / 10
					});
				}
			} else {
				const tvData = await providers.tmdb.GET('/3/tv/{series_id}', {
					params: {
						path: {
							series_id: Number(tmdbId)
						}
					}
				});

				if (tvData.data?.vote_average) {
					scores.push({
						name: 'tmdb',
						image: 'tmdb.png',
						score: Math.round(tvData.data.vote_average * 10) / 10
					});
				}
			}
		} catch (e) {
			console.error('TMDB rating fetch failed:', e);
		}

		// 2. Get IMDB ID for other providers
		let imdbId: string | null = null;
		try {
			if (mediaType === 'movie') {
				const externalIds = await providers.tmdb.GET('/3/movie/{movie_id}/external_ids', {
					params: {
						path: {
							movie_id: Number(tmdbId)
						}
					}
				});
				imdbId = externalIds.data?.imdb_id || null;
			} else {
				const externalIds = await providers.tmdb.GET('/3/tv/{series_id}/external_ids', {
					params: {
						path: {
							series_id: Number(tmdbId)
						}
					}
				});
				imdbId = externalIds.data?.imdb_id || null;
			}
		} catch (e) {
			console.error('Failed to fetch IMDB ID:', e);
		}

		if (imdbId) {
			// 3. IMDB Rating via Cinemeta
			try {
				const cinemetaType = mediaType === 'movie' ? 'movie' : 'series';
				const cinemetaUrl = `https://v3-cinemeta.strem.io/meta/${cinemetaType}/${imdbId}.json`;

				const cinemetaResponse = await fetch(cinemetaUrl);
				if (cinemetaResponse.ok) {
					const cinemetaData = await cinemetaResponse.json();
					const imdbRating = cinemetaData?.meta?.imdbRating;

					if (imdbRating) {
						scores.push({
							name: 'imdb',
							image: 'imdb.png',
							score: imdbRating
						});
					}
				}
			} catch (e) {
				console.error('IMDB rating fetch failed:', e);
			}

			// 4. Trakt Rating (optional - requires API key)
			const traktClientId = env.TRAKT_CLIENT_ID;
			if (traktClientId) {
				try {
					const traktType = mediaType === 'movie' ? 'movies' : 'shows';
					const traktUrl = `https://api.trakt.tv/${traktType}/${imdbId}/ratings`;

					const traktResponse = await fetch(traktUrl, {
						headers: {
							'Content-Type': 'application/json',
							'trakt-api-version': '2',
							'trakt-api-key': traktClientId
						}
					});

					if (traktResponse.ok) {
						const traktData = await traktResponse.json();
						const traktRating = traktData?.rating;

						if (traktRating) {
							scores.push({
								name: 'trakt',
								image: 'trakt.png',
								score: Math.round(traktRating * 10) / 10
							});
						}
					}
				} catch (e) {
					console.error('Trakt rating fetch failed:', e);
				}
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
			tmdbId: Number(tmdbId),
			mediaType,
			imdbId
		});
	} catch (e) {
		console.error('Rating fetch error:', e);
		throw error(500, 'Failed to fetch ratings');
	}
};
