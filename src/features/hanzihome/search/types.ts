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
]);
export type HanziHomeSearchKind = z.infer<typeof HanziHomeSearchKindSchema>;
const searchMetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const HanziHomeSearchIndexItemSchema = z.object({
 id: z.string(),
 kind: HanziHomeSearchKindSchema,
 title: z.string(),
 subtitle: z.string().optional(),
 searchText: z.string(),
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

export const HanziHomeSearchIndexResponseSchema = z.object({
 items: z.array(HanziHomeSearchIndexItemSchema),
});

export type HanziHomeSearchIndexItem = z.infer<typeof HanziHomeSearchIndexItemSchema>;

export type HanziHomeSearchOptions = {
 limit?: number;
 kinds?: HanziHomeSearchKind[];
 courseId?: string;
 lessonId?: string;
 includeGlobal?: boolean;
 activeLessonBoost?: boolean;
};

export type HanziHomeSearchCategory =
 | "all"
 | "vocab"
 | "grammar"
 | "lesson"
 | "exercise"
 | "radical";

export type HanziHomeSearchResult = {
 item: HanziHomeSearchIndexItem;
 score: number;
 matchedSnippet?: string;
};

export const HanziHomeSearchNavigationIntentSchema = z.object({
 id: z.string(),
 courseId: z.string().optional(),
 lessonId: z.string().optional(),
 lessonNumber: z.number().optional(),
 module: moduleSchema.optional(),
 targetId: z.string().optional(),
});
export type HanziHomeSearchNavigationIntent = z.infer<typeof HanziHomeSearchNavigationIntentSchema>;
