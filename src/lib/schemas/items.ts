import * as z from "zod";

const sortEnum = z.enum(["title_asc", "title_desc", "date_asc", "date_desc"]);

export const itemsSearchSchema = z.object({
    limit: z.coerce
        .number<number>()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must be at most 100")
        .optional()
        .default(24),
    page: z.coerce.number<number>().min(1, "Page must be at least 1").optional().default(1),
    type: z.array(z.string().min(1)).optional().default(["movie", "show"]),
    states: z
        .array(z.string().min(1))
        .min(1, "At least one state must be selected")
        .optional()
        .default(["All"]),
    sort: z
        .array(sortEnum)
        .min(1, "At least one sort option must be selected")
        .optional()
        .default(["date_desc"]),
    search: z.string().min(1, "Search term must be at least 1 character").optional()
});

export type ItemsSearchSchema = z.infer<typeof itemsSearchSchema>;
export const sortOptions = sortEnum.enum;
