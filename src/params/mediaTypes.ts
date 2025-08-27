import type { ParamMatcher } from "@sveltejs/kit";

const MEDIA_TYPES = ["tv", "movie"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const match = ((param: string): param is MediaType => {
    return MEDIA_TYPES.includes(param as MediaType);
}) satisfies ParamMatcher;
