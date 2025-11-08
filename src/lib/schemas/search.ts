import { z } from "zod";

/**
 * Schema for search query parameters
 * Used for validating GET request search params
 */
export const searchSchema = z.object({
    // The search query string
    query: z.string().min(1).optional(),

    // Media type filter
    type: z.enum(["movie", "tv", "both"]).default("both")
});

export type SearchFormData = z.infer<typeof searchSchema>;
