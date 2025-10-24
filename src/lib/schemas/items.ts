import * as z from "zod";

export const itemsSearchSchema = z.object({
    limit: z.coerce
        .number<number>()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must be at most 100")
        .optional()
        .default(24),
    page: z.coerce.number<number>().min(1, "Page must be at least 1").optional().default(1),
    type: z
        .array(z.enum(["movie", "show", "season", "episode", "anime"]))
        .optional()
        .default(["movie", "show"]),
    states: z
        .array(
            z.enum([
                "All",
                "Unknown",
                "Unreleased",
                "Ongoing",
                "Requested",
                "Indexed",
                "Scraped",
                "Downloaded",
                "Symlinked",
                "Completed",
                "PartiallyCompleted",
                "Failed",
                "Paused"
            ])
        )
        .optional()
        .default(["All"]),
    sort: z
        .array(z.enum(["title_asc", "title_desc", "date_asc", "date_desc"]))
        .optional()
        .default(["date_desc"]),
    search: z.string().min(1, "Search term must be at least 1 character").optional(),
    extended: z.coerce.boolean<boolean>().optional().default(false)
});

export type ItemsSearchSchema = z.infer<typeof itemsSearchSchema>;
