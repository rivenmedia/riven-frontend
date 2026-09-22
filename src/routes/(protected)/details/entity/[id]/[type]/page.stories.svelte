<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import EntityPage from "./+page.svelte";

    const { Story } = defineMeta({
        title: "pages/EntityDetails",
        component: EntityPage,
        tags: ["autodocs"],
        parameters: {
            layout: "fullscreen"
        }
    });
</script>

<script lang="ts">
    import type { PersonDetails } from "$lib/metadata/parser.types";
    import { getPermissionFlags } from "$lib/permissions";

    const user = { id: "1", name: "Alice", email: "alice@example.com" };
    const permissions = getPermissionFlags("user");

    const baseCredits = {
        poster_path: null,
        backdrop_path: null,
        release_date: "2023-03-24",
        year: 2023,
        vote_average: 7.8,
        vote_count: 4200,
        popularity: 120
    };

    const person: PersonDetails = {
        id: 6384,
        indexer: "tmdb",
        name: "Keanu Reeves",
        biography:
            "Keanu Charles Reeves is a Canadian actor. Born in Beirut and raised in Toronto, he began acting in theatre productions and in television films before making his feature film debut in 1986.",
        birthday: "1964-09-02",
        deathday: null,
        place_of_birth: "Beirut, Lebanon",
        profile_path: null,
        known_for_department: "Acting",
        gender: "Male",
        popularity: 45.2,
        homepage: null,
        imdb_id: "nm0000206",
        tvdb_url: null,
        external_ids: { tmdb: "6384" },
        also_known_as: ["Keanu Charles Reeves"],
        cast_credits: [
            {
                ...baseCredits,
                id: 603692,
                title: "John Wick: Chapter 4",
                original_title: "John Wick: Chapter 4",
                character: "John Wick",
                media_type: "movie"
            },
            {
                ...baseCredits,
                id: 1,
                title: "The Matrix",
                original_title: "The Matrix",
                character: "Neo",
                media_type: "movie",
                release_date: "1999-03-31",
                year: 1999
            }
        ],
        crew_credits: []
    };

    const noCreditsPerson: PersonDetails = {
        ...person,
        id: 9999,
        name: "New Face",
        biography: null,
        birthday: null,
        place_of_birth: null,
        also_known_as: [],
        cast_credits: [],
        crew_credits: []
    };

    const deceasedPerson: PersonDetails = {
        ...person,
        id: 1231,
        name: "River Phoenix",
        biography:
            "River Jude Phoenix was an American actor and musician. Over the course of his decade-long career, Phoenix was considered one of the leading young actors in the film industry, appearing in over 24 movies and television shows before his death at age 23.",
        birthday: "1970-08-23",
        deathday: "1993-10-31",
        place_of_birth: "Madras, Oregon, USA",
        also_known_as: []
    };

    // Person sourced from TVDB rather than TMDB, exercising the TVDB badge/link branch.
    const tvdbPerson: PersonDetails = {
        id: 280623,
        indexer: "tvdb",
        name: "Pedro Pascal",
        biography:
            "Pedro Pascal is a Chilean-American actor known for his roles in prestige television dramas.",
        birthday: "1975-04-02",
        deathday: null,
        place_of_birth: "Santiago, Chile",
        profile_path: null,
        known_for_department: "Actor",
        gender: "Male",
        popularity: null,
        homepage: null,
        imdb_id: "nm0669791",
        tvdb_url: "https://thetvdb.com/people/280623",
        external_ids: {},
        also_known_as: ["Pedro Balmaceda Pascal"],
        cast_credits: [
            {
                ...baseCredits,
                id: 121361,
                title: "Game of Thrones",
                original_title: "Game of Thrones",
                character: "Oberyn Martell",
                media_type: "tv",
                indexer: "tvdb"
            },
            {
                ...baseCredits,
                id: 65654,
                title: "The Last of Us",
                original_title: "The Last of Us",
                character: "Joel Miller",
                media_type: "tv",
                release_date: "2023-01-15",
                year: 2023,
                indexer: "tvdb"
            }
        ],
        crew_credits: []
    };

    // Production company details are parsed into the same PersonDetails shape
    // (see parseCompanyDetails), reusing "cast_credits" for its filmography.
    const company: PersonDetails = {
        id: 420,
        indexer: "tmdb",
        name: "Marvel Studios",
        biography:
            "Marvel Studios, LLC is an American film and television production company that is a subsidiary of Walt Disney Studios, a division of The Walt Disney Company.",
        birthday: null,
        deathday: null,
        place_of_birth: "US",
        profile_path: null,
        known_for_department: "Production",
        gender: null,
        popularity: null,
        homepage: "https://www.marvel.com",
        imdb_id: null,
        tvdb_url: null,
        external_ids: {},
        also_known_as: [],
        cast_credits: [
            {
                ...baseCredits,
                id: 299536,
                title: "Avengers: Infinity War",
                original_title: "Avengers: Infinity War",
                character: "Production",
                media_type: "movie",
                release_date: "2018-04-25",
                year: 2018
            },
            {
                ...baseCredits,
                id: 1399,
                title: "Loki",
                original_title: "Loki",
                character: "Production",
                media_type: "tv",
                release_date: "2021-06-09",
                year: 2021
            }
        ],
        crew_credits: []
    };

    // A company with no headquarters/description falls back to the
    // "Headquarters: Unknown" biography built by parseCompanyDetails.
    const companyNoDescription: PersonDetails = {
        ...company,
        id: 421,
        name: "Unknown Pictures",
        biography: "Headquarters: Unknown",
        place_of_birth: null,
        homepage: null,
        cast_credits: []
    };
</script>

<Story name="Default" args={{ data: { entity: person, user, permissions } }} />

<Story name="NoCredits" args={{ data: { entity: noCreditsPerson, user, permissions } }} />

<Story name="Deceased" args={{ data: { entity: deceasedPerson, user, permissions } }} />

<Story name="TvdbPerson" args={{ data: { entity: tvdbPerson, user, permissions } }} />

<Story name="Company" args={{ data: { entity: company, user, permissions } }} />

<Story
    name="CompanyNoDescription"
    args={{ data: { entity: companyNoDescription, user, permissions } }} />
