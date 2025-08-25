import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "tv" | "movie" => {
    return param === "tv" || param === "movie";
}) satisfies ParamMatcher;
