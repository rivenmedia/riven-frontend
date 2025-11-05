import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "tmdb" | "anilist" | "tvdb" | "riven" => {
    return param === "tmdb" || param === "anilist" || param === "tvdb" || param === "riven";
}) satisfies ParamMatcher;
