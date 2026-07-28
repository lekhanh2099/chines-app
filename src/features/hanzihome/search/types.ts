import type { HanziHomeModule } from "@/features/hanzihome/types";
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
const SearchMetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type HanziHomeSearchIndexItem = {
 id: string;
 kind: HanziHomeSearchKind;
 title: string;
 subtitle?: string;
 searchText: string;
 courseId?: string;
 courseTitle?: string;
 bookId?: string;
 lessonId?: string;
 lessonNumber?: number;
 module?: HanziHomeModule;
 targetId?: string;
 href?: string;
 metadata?: Record<string, z.infer<typeof SearchMetadataValueSchema>>;
};

export type HanziHomeSearchOptions = {
 limit?: number;
 kinds?: HanziHomeSearchKind[];
 courseId?: string;
 lessonId?: string;
 includeGlobal?: boolean;
 activeLessonBoost?: boolean;
};

export type HanziHomeSearchResult = {
 item: HanziHomeSearchIndexItem;
 score: number;
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
