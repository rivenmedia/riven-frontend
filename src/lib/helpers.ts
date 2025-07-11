export function getSeasonAndYear(dateString: string): string {
	if (!dateString) return 'TBA';

	const date = new Date(dateString);
	const month = date.getMonth();
	const year = date.getFullYear();

	let season;
	if (month >= 2 && month <= 4) {
		season = 'Spring';
	} else if (month >= 5 && month <= 7) {
		season = 'Summer';
	} else if (month >= 8 && month <= 10) {
		season = 'Fall';
	} else {
		season = 'Winter';
	}

	return `${season} ${year}`;
}

export interface StandardizedMedia {
	id: string | number;
	title: string;
	poster_path: string;
	media_type: 'movie' | 'tv' | 'anime';
	year?: number;
	overview?: string;
	rating?: number;
	originalData?: any;
}

// utils/mediaParser.ts
export class MediaParser {
	static parseTMDBMovie(item: any): StandardizedMedia {
		return {
			id: item.id,
			title: item.title || item.name,
			poster_path: item.poster_path,
			media_type: item.media_type || 'movie',
			year: item.release_date ? new Date(item.release_date).getFullYear() : undefined,
			overview: item.overview,
			rating: item.vote_average,
			originalData: item
		};
	}

	static parseTMDBShow(item: any): StandardizedMedia {
		return {
			id: item.id,
			title: item.name || item.title,
			poster_path: item.poster_path,
			media_type: 'tv',
			year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
			overview: item.overview,
			rating: item.vote_average,
			originalData: item
		};
	}

	static parseAnilist(item: any): StandardizedMedia {
		return {
			id: item.id,
			title: item.title.romaji || item.title.english || item.title.native,
			poster_path: item.coverImage.large,
			media_type: 'anime',
			year: item.seasonYear,
			overview: item.description,
			rating: item.averageScore,
			originalData: item
		};
	}

	static parseList(data: any[], type: 'tmdb-movie' | 'tmdb-tv' | 'anilist'): StandardizedMedia[] {
		switch (type) {
			case 'tmdb-movie':
				return data.map((item) => this.parseTMDBMovie(item));
			case 'tmdb-tv':
				return data.map((item) => this.parseTMDBShow(item));
			case 'anilist':
				return data.map((item) => this.parseAnilist(item));
			default:
				return [];
		}
	}
}
