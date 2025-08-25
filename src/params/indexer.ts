import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "tmdb" | "anilist" => {
    return param === "tmdb" || param === "anilist";
}) satisfies ParamMatcher;
