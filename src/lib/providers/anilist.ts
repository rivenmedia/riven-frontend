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

const trendingQuery = `
query {
  Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: TRENDING_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        medium
      }
      bannerImage
      episodes
      duration
      status
      season
      seasonYear
      genres
      averageScore
      popularity
      trending
      format
      studios {
        nodes {
          name
        }
      }
      nextAiringEpisode {
        episode
        timeUntilAiring
      }
    }
  }
}
`;

type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;

export async function getTrending(fetch: FetchFunction) {
    try {
        const response = await fetch(ANILIST_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                query: trendingQuery
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
