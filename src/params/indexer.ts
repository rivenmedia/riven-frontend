import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "tmdb" | "anilist" | "tvdb" => {
    return param === "tmdb" || param === "anilist" || param === "tvdb";
}) satisfies ParamMatcher;
