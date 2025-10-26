import type { PageServerLoad } from "./$types";
import providers, { TMDB_IMAGE_BASE_URL } from "$lib/providers";
import { error } from "@sveltejs/kit";

export interface PersonCreditCast {
    id: number;
    title: string;
    original_title: string;
    character: string | null;
    poster_path: string | null;
    release_date: string | null;
    year: number | null;
    media_type: "movie" | "tv";
    vote_average: number | null;
}

export interface PersonCreditCrew {
    id: number;
    title: string;
    original_title: string;
    job: string | null;
    department: string | null;
    poster_path: string | null;
    release_date: string | null;
    year: number | null;
    media_type: "movie" | "tv";
    vote_average: number | null;
}

export interface PersonDetails {
    id: number;
    name: string;
    biography: string | null;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    profile_path: string | null;
    known_for_department: string | null;
    gender: number | null;
    popularity: number | null;
    homepage: string | null;
    imdb_id: string | null;
    also_known_as: string[];
    cast_credits: PersonCreditCast[];
    crew_credits: PersonCreditCrew[];
}

export const load = (async ({ fetch, params }) => {
    const { id } = params;

    if (!id || isNaN(Number(id))) {
        error(400, "Invalid person ID");
    }

    const { data: personData, error: personError } = await providers.tmdb.GET(
        "/3/person/{person_id}",
        {
            params: {
                path: {
                    person_id: Number(id)
                },
                query: {
                    append_to_response: "combined_credits,external_ids"
                }
            },
            fetch: fetch
        }
    );

    if (personError) {
        error(500, personError);
    }

    // Helper to get gender string
    const getGenderString = (gender: number | null) => {
        switch (gender) {
            case 1:
                return "Female";
            case 2:
                return "Male";
            case 3:
                return "Non-binary";
            default:
                return null;
        }
    };

    // Transform cast credits
    const castCredits: PersonCreditCast[] = (personData.combined_credits?.cast ?? [])
        .map((credit) => ({
            id: credit.id ?? 0,
            title: credit.title || credit.name || credit.original_title || credit.original_name || "",
            original_title: credit.original_title || credit.original_name || "",
            character: credit.character ?? null,
            poster_path: credit.poster_path
                ? `${TMDB_IMAGE_BASE_URL}/w500${credit.poster_path}`
                : null,
            release_date: credit.release_date || credit.first_air_date || null,
            year:
                credit.release_date || credit.first_air_date
                    ? new Date(credit.release_date || credit.first_air_date || "").getFullYear()
                    : null,
            media_type: credit.media_type === "tv" ? "tv" : "movie",
            vote_average: credit.vote_average ?? null
        }))
        .sort((a, b) => {
            // Sort by release date (newest first)
            if (a.release_date && b.release_date) {
                return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            }
            if (a.release_date) return -1;
            if (b.release_date) return 1;
            return 0;
        });

    // Transform crew credits
    const crewCredits: PersonCreditCrew[] = (personData.combined_credits?.crew ?? [])
        .map((credit) => ({
            id: credit.id ?? 0,
            title: credit.title || credit.name || credit.original_title || credit.original_name || "",
            original_title: credit.original_title || credit.original_name || "",
            job: credit.job ?? null,
            department: credit.department ?? null,
            poster_path: credit.poster_path
                ? `${TMDB_IMAGE_BASE_URL}/w500${credit.poster_path}`
                : null,
            release_date: credit.release_date || credit.first_air_date || null,
            year:
                credit.release_date || credit.first_air_date
                    ? new Date(credit.release_date || credit.first_air_date || "").getFullYear()
                    : null,
            media_type: credit.media_type === "tv" ? "tv" : "movie",
            vote_average: credit.vote_average ?? null
        }))
        .sort((a, b) => {
            // Sort by release date (newest first)
            if (a.release_date && b.release_date) {
                return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            }
            if (a.release_date) return -1;
            if (b.release_date) return 1;
            return 0;
        });

    // Transform the person data
    const person: PersonDetails = {
        id: personData.id ?? 0,
        name: personData.name ?? "",
        biography: personData.biography ?? null,
        birthday: personData.birthday ?? null,
        deathday: personData.deathday ?? null,
        place_of_birth: personData.place_of_birth ?? null,
        profile_path: personData.profile_path
            ? `${TMDB_IMAGE_BASE_URL}/h632${personData.profile_path}`
            : null,
        known_for_department: personData.known_for_department ?? null,
        gender: getGenderString(personData.gender ?? null) as any,
        popularity: personData.popularity ?? null,
        homepage: personData.homepage ?? null,
        imdb_id: personData.external_ids?.imdb_id ?? null,
        also_known_as: personData.also_known_as ?? [],
        cast_credits: castCredits,
        crew_credits: crewCredits
    };

    return {
        person
    };
}) satisfies PageServerLoad;
