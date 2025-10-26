import { z } from "zod";

/**
 * Schema for search query parameters
 * Used for validating GET request search params
 */
export const searchSchema = z.object({
	// The search query string
	q: z.string().min(1).optional(),

	// Media type filter
	type: z.enum(["movie", "tv", "both"]).default("both"),

	// Year filter
	year: z.coerce.number().int().min(1900).max(2100).optional(),

	// Page number for pagination
	page: z.coerce.number().int().min(1).default(1),

	// Sort by option
	sort: z.string().optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;
