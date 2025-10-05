export type AnilistTrendingResponse = {
    data: {
        Page: {
            media: AnilistTrendingMediaItem[];
        };
    };
};

export type AnilistTrendingMediaItem = {
    id: number;
    title: {
        romaji: string;
        english: string;
        native: string;
    };
    coverImage: {
        large: string;
    };
    seasonYear: number;
    format: string;
};

export const ANILIST_BASE_URL = "https://graphql.anilist.co";

const getTrendingQuery = (page: number, perPage: number = 20) => `
query {
  Page(page: ${page}, perPage: ${perPage}) {
    media(type: ANIME, sort: TRENDING_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      seasonYear
      format
    }
  }
}
`;

const mediaRatingsQuery = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    averageScore
    meanScore
  }
}
`;

export type AnilistMediaRatingsResponse = {
    data: {
        Media: {
            id: number;
            averageScore: number | null;
            meanScore: number | null;
        };
    };
};

type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;

export async function getTrending(fetch: FetchFunction, page: number = 1) {
    try {
        const response = await fetch(ANILIST_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                query: getTrendingQuery(page)
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error("GraphQL errors:", data.errors);
            return null;
        }

        return data as AnilistTrendingResponse;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

export async function getMediaDetails(anilistId: number, fetch: FetchFunction) {
    try {
        const response = await fetch(ANILIST_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                query: mediaRatingsQuery,
                variables: { id: anilistId }
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error("GraphQL errors:", data.errors);
            return null;
        }

        return data as AnilistMediaRatingsResponse;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}
