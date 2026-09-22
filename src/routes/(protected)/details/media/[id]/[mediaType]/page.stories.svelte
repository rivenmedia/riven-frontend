<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import { graphql, HttpResponse } from "msw";
    import MediaDetailsPage from "./+page.svelte";

    const gqlEndpoint = graphql.link("/graphql");

    const { Story } = defineMeta({
        title: "pages/MediaDetails",
        component: MediaDetailsPage,
        tags: ["autodocs"],
        parameters: {
            layout: "fullscreen",
            docs: {
                description: {
                    component:
                        "A static snapshot only: the page also opens a live-state subscription and hydrates completed-item details over GraphQL on mount — neither is mocked here, so those requests simply fail quietly in the background and the render stays pinned to the seeded `data`."
                }
            }
        }
    });
</script>

<script lang="ts">
    import type { ParsedMovieDetails, ParsedShowDetails } from "$lib/metadata/parser";
    import type { MediaDetails } from "./+page.server";
    import type { RivenMediaItem } from "$lib/types/riven";
    import { getPermissionFlags } from "$lib/permissions";

    const user = { id: "1", name: "Alice", email: "alice@example.com" };
    const permissions = getPermissionFlags("user");

    const mockRatingsHandler = gqlEndpoint.query("Ratings", () =>
        HttpResponse.json({
            data: {
                ratings: {
                    scores: [
                        {
                            name: "TMDB",
                            score: "8.2",
                            url: "https://www.themoviedb.org",
                            image: "tmdb.svg"
                        },
                        {
                            name: "IMDb",
                            score: "8.4",
                            url: "https://www.imdb.com",
                            image: "imdb.svg"
                        }
                    ]
                }
            }
        })
    );

    const baseListItem = {
        vote_average: 7.9,
        vote_count: 3100,
        indexer: "tmdb" as const
    };

    // -----------------------------------------------------------------
    // Movie
    // -----------------------------------------------------------------

    const movieDetails: ParsedMovieDetails = {
        id: 693134,
        type: "movie",
        title: "Dune: Part Two",
        original_title: "Dune: Part Two",
        original_language: "en",
        overview:
            "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee.",
        tagline: "Long live the fighters.",
        status: "Released",
        release_date: "2024-02-27",
        end_date: null,
        next_air_date: null,
        year: 2024,
        runtime: 166,
        formatted_runtime: "2h 46m",
        homepage: "https://www.dunemovie.com",
        backdrop_path: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        poster_path: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        logo: null,
        trailer: {
            name: "Official Trailer",
            site: "YouTube",
            key: "Way9Dexny3w",
            url: "https://www.youtube.com/watch?v=Way9Dexny3w"
        },
        certification: "PG-13",
        genres: [
            { id: 878, name: "Science Fiction" },
            { id: 12, name: "Adventure" }
        ],
        cast: [
            {
                id: 1190668,
                name: "Timothée Chalamet",
                character: "Paul Atreides",
                profile_path: null,
                external_source: "tmdb"
            },
            {
                id: 505710,
                name: "Zendaya",
                character: "Chani",
                profile_path: null,
                external_source: "tmdb"
            },
            {
                id: 71,
                name: "Rebecca Ferguson",
                character: "Lady Jessica",
                profile_path: null,
                external_source: "tmdb"
            }
        ],
        crew: [{ id: 137427, name: "Denis Villeneuve", job: "Director", profile_path: null }],
        origin_country: ["US"],
        spoken_languages: [{ english_name: "English", iso_639_1: "en", name: "English" }],
        production_companies: [
            { id: 923, name: "Legendary Pictures", logo_path: null, origin_country: "US" }
        ],
        production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
        recommendations: [
            {
                ...baseListItem,
                id: 438631,
                title: "Dune",
                original_title: "Dune",
                poster_path: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
                media_type: "movie",
                year: "2021"
            }
        ],
        similar: [
            {
                ...baseListItem,
                id: 976573,
                title: "Elemental",
                original_title: "Elemental",
                poster_path: null,
                media_type: "movie",
                year: "2023"
            }
        ],
        trakt_recommendations: [
            {
                ...baseListItem,
                id: 823464,
                title: "Godzilla x Kong: The New Empire",
                original_title: "Godzilla x Kong: The New Empire",
                poster_path: null,
                media_type: "movie",
                year: "2024"
            }
        ],
        adult: false,
        vote_average: 8.2,
        vote_count: 8700,
        budget: 190000000,
        revenue: 714000000,
        imdb_id: "tt15239678",
        external_ids: {
            imdb_id: "tt15239678",
            wikidata_id: null,
            facebook_id: null,
            instagram_id: null,
            twitter_id: null
        },
        collection: {
            id: 726871,
            name: "Dune Collection",
            poster_path: null,
            backdrop_path: "https://image.tmdb.org/t/p/original/wCpPHt6EMzC2SzP0FiJTPHR8YWD.jpg"
        }
    };

    const movieRiven: RivenMediaItem = {
        id: 501,
        state: "Completed",
        imdb_id: "tt15239678",
        tmdb_id: "693134",
        media_metadata: {
            filename: "Dune.Part.Two.2024.2160p.UHD.BluRay.mkv",
            video: { codec: "hevc", resolution_width: 3840, resolution_height: 2160 },
            quality_source: "BluRay",
            is_remux: true
        },
        filesystem_entry: {
            id: 9001,
            file_size: 45097156608,
            original_filename: "Dune.Part.Two.2024.2160p.UHD.BluRay.REMUX.mkv",
            path: "/movies/Dune Part Two (2024)/Dune.Part.Two.2024.2160p.UHD.BluRay.REMUX.mkv"
        }
    };

    const movieData = {
        user,
        permissions,
        riven: movieRiven,
        rivenPending: false,
        resolvedTvdbId: null,
        mediaDetails: { type: "movie", details: movieDetails } as MediaDetails
    };

    const movieNotRequestedData = {
        ...movieData,
        riven: undefined,
        mediaDetails: {
            type: "movie",
            details: { ...movieDetails, id: 693135 }
        } as MediaDetails
    };

    // -----------------------------------------------------------------
    // TV Show
    // -----------------------------------------------------------------

    const showSeriesId = 392256;

    function episode(
        number: number,
        seasonNumber: number,
        name: string,
        aired: string,
        id: number
    ) {
        return {
            id,
            seriesId: showSeriesId,
            name,
            aired,
            runtime: 55,
            nameTranslations: null,
            overview: `Episode ${number} of season ${seasonNumber}.`,
            overviewTranslations: null,
            image: null,
            imageType: 0,
            isMovie: 0,
            seasons: null,
            number,
            absoluteNumber: null,
            seasonNumber,
            lastUpdated: null,
            finaleType: null,
            year: aired.slice(0, 4)
        };
    }

    function season(number: number, id: number) {
        return {
            id,
            seriesId: showSeriesId,
            type: { id: 1, name: "Aired Order", type: "official", alternateName: null },
            number,
            nameTranslations: null,
            overviewTranslations: null,
            image: null,
            imageType: null,
            companies: null,
            lastUpdated: null
        };
    }

    const showDetails: ParsedShowDetails = {
        id: showSeriesId,
        type: "show",
        title: "The Last of Us",
        original_title: "The Last of Us",
        original_language: "eng",
        overview:
            "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.",
        tagline: null,
        status: "Continuing",
        release_date: "2023-01-15",
        end_date: null,
        next_air_date: "2025-04-13",
        year: 2023,
        runtime: 55,
        formatted_runtime: "55m",
        homepage: "https://thetvdb.com/series/the-last-of-us",
        backdrop_path: "https://image.tmdb.org/t/p/original/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
        poster_path: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
        logo: null,
        trailer: null,
        certification: "TV-MA",
        genres: [
            { id: 1, name: "Drama", slug: "drama" },
            { id: 2, name: "Horror", slug: "horror" }
        ],
        cast: [
            {
                id: 280623,
                name: "Pedro Pascal",
                character: "Joel Miller",
                profile_path: null,
                external_source: "tvdb"
            },
            {
                id: 460577,
                name: "Bella Ramsey",
                character: "Ellie Williams",
                profile_path: null,
                external_source: "tvdb"
            }
        ],
        crew: [],
        origin_country: ["US"],
        spoken_languages: null,
        production_companies: [],
        production_countries: [{ iso_3166_1: "US", name: "United States of America" }],
        recommendations: [],
        similar: [],
        trakt_recommendations: [
            {
                ...baseListItem,
                id: 60625,
                title: "Chernobyl",
                original_title: "Chernobyl",
                poster_path: null,
                media_type: "tv",
                year: "2019"
            }
        ],
        score: 987.5,
        imdb_id: "tt3581920",
        external_ids: { tmdb: "100088", imdb: "tt3581920" },
        airing: { time: "21:00", days: ["Sunday"] },
        episode_count: 4,
        season_count: 2,
        seasons: [season(1, 1001), season(2, 1002)],
        episodes: [
            episode(1, 1, "When You're Lost in the Darkness", "2023-01-15", 8000001),
            episode(2, 1, "Infected", "2023-01-22", 8000002),
            episode(1, 2, "Future Days", "2025-04-13", 8000003),
            episode(2, 2, "Through the Valley", "2025-04-20", 8000004)
        ],
        networks: [{ id: 1, name: "HBO", country: "USA" }],
        content_ratings: [{ id: 1, name: "TV-MA", country: "USA", description: "Mature audiences" }]
    };

    const showRiven: RivenMediaItem = {
        id: 900,
        state: "PartiallyCompleted",
        tvdb_id: String(showSeriesId),
        seasons: [
            {
                season_number: 1,
                state: "Completed",
                is_requested: true,
                episodes: [
                    {
                        episode_number: 1,
                        state: "Completed",
                        filesystem_entry: {
                            id: 1,
                            file_size: 5100000000,
                            path: "/shows/The Last of Us/Season 01/S01E01.mkv"
                        }
                    },
                    {
                        episode_number: 2,
                        state: "Completed",
                        filesystem_entry: {
                            id: 2,
                            file_size: 4800000000,
                            path: "/shows/The Last of Us/Season 01/S01E02.mkv"
                        }
                    }
                ]
            },
            {
                season_number: 2,
                state: "Ongoing",
                is_requested: true,
                episodes: [
                    {
                        episode_number: 1,
                        state: "Completed",
                        filesystem_entry: {
                            id: 3,
                            file_size: 5300000000,
                            path: "/shows/The Last of Us/Season 02/S02E01.mkv"
                        }
                    },
                    { episode_number: 2, state: "Scraped" }
                ]
            }
        ]
    };

    const showData = {
        user,
        permissions,
        riven: showRiven,
        rivenPending: false,
        resolvedTvdbId: showSeriesId,
        mediaDetails: { type: "tv", details: showDetails } as MediaDetails
    };

    const showNotRequestedData = {
        ...showData,
        riven: undefined,
        mediaDetails: {
            type: "tv",
            details: { ...showDetails, id: showSeriesId + 1 }
        } as MediaDetails
    };
</script>

<Story
    name="Movie"
    beforeEach={({ msw }) => {
        msw.use(mockRatingsHandler);
    }}
    args={{ data: movieData }} />

<Story
    name="MovieNotRequested"
    beforeEach={({ msw }) => {
        msw.use(mockRatingsHandler);
    }}
    args={{ data: movieNotRequestedData }} />

<Story
    name="TvShow"
    beforeEach={({ msw }) => {
        msw.use(mockRatingsHandler);
    }}
    args={{ data: showData }} />

<Story
    name="TvShowNotRequested"
    beforeEach={({ msw }) => {
        msw.use(mockRatingsHandler);
    }}
    args={{ data: showNotRequestedData }} />
