import { z } from "zod";
import { moduleSchema } from "@/features/hanzihome/schemas/learning-state.schema";

export const HanziHomeSearchKindSchema = z.enum([
 "vocab",
 "grammar",
 "lesson_text",
 "section",
 "exercise",
 "radical",
 "note",
 "navigation",
 "reader_document",
]);
export type HanziHomeSearchKind = z.infer<typeof HanziHomeSearchKindSchema>;
const searchMetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const HanziHomeSearchIndexItemSchema = z.object({
 id: z.string(),
 kind: HanziHomeSearchKindSchema,
 title: z.string(),
 subtitle: z.string().optional(),
 searchText: z.string(),
 pinyin: z.string().optional(),
 courseId: z.string().optional(),
 courseTitle: z.string().optional(),
 bookId: z.string().optional(),
 lessonId: z.string().optional(),
 lessonNumber: z.number().optional(),
 module: moduleSchema.optional(),
 targetId: z.string().optional(),
 href: z.string().optional(),
 metadata: z.record(z.string(), searchMetadataValueSchema).optional(),
});

export type HanziHomeSearchIndexItem = z.infer<typeof HanziHomeSearchIndexItemSchema>;

/** The navigable, displayable part of an indexed item; the indexed text stays on the server. */
export const HanziHomeSearchResultItemSchema = HanziHomeSearchIndexItemSchema.omit({
 searchText: true,
});
export type HanziHomeSearchResultItem = z.infer<typeof HanziHomeSearchResultItemSchema>;

export const HanziHomeSearchCategorySchema = z.enum([
 "all",
 "vocab",
 "grammar",
 "exercise",
 "lesson",
 "reading",
 "note",
 "radical",
]);
export type HanziHomeSearchCategory = z.infer<typeof HanziHomeSearchCategorySchema>;

export const HANZIHOME_SEARCH_DEFAULT_LIMIT = 40;
export const HANZIHOME_SEARCH_MAX_LIMIT = 60;
export const HANZIHOME_SEARCH_MAX_QUERY_LENGTH = 200;

export const HanziHomeSearchRequestSchema = z.object({
 q: z.string().trim().min(1).max(HANZIHOME_SEARCH_MAX_QUERY_LENGTH),
 category: HanziHomeSearchCategorySchema.default("all"),
 limit: z.coerce
  .number()
  .int()
  .min(1)
  .max(HANZIHOME_SEARCH_MAX_LIMIT)
  .default(HANZIHOME_SEARCH_DEFAULT_LIMIT),
 courseId: z.string().trim().min(1).optional(),
 lessonId: z.string().trim().min(1).optional(),
});
export type HanziHomeSearchRequest = z.infer<typeof HanziHomeSearchRequestSchema>;

export const HanziHomeSearchResultSchema = z.object({
 item: HanziHomeSearchResultItemSchema,
 score: z.number(),
 matchedSnippet: z.string().optional(),
 /** Original text of the first match inside the snippet, for diacritic-insensitive highlighting. */
 matchedText: z.string().optional(),
});
export type HanziHomeSearchResult = z.infer<typeof HanziHomeSearchResultSchema>;

export const HanziHomeSearchCategoryCountsSchema = z.record(
 HanziHomeSearchCategorySchema,
 z.number().int().nonnegative(),
);
export type HanziHomeSearchCategoryCounts = z.infer<typeof HanziHomeSearchCategoryCountsSchema>;

export const HanziHomeSearchResponseSchema = z.object({
 query: z.string(),
 category: HanziHomeSearchCategorySchema,
 results: z.array(HanziHomeSearchResultSchema),
 counts: HanziHomeSearchCategoryCountsSchema,
});
export type HanziHomeSearchResponse = z.infer<typeof HanziHomeSearchResponseSchema>;

export const HanziHomeSearchNavigationIntentSchema = z.object({
 id: z.string(),
 courseId: z.string().optional(),
 lessonId: z.string().optional(),
 lessonNumber: z.number().optional(),
 module: moduleSchema.optional(),
 targetId: z.string().optional(),
});
export type HanziHomeSearchNavigationIntent = z.infer<typeof HanziHomeSearchNavigationIntentSchema>;
