import { z } from "zod";

import { moduleSchema } from "@/features/hanzihome/schemas/learning-state.schema";
import type { NoteListItem } from "@/services/notes.service";

export const HomeLessonTargetSchema = z.object({
 href: z.string(),
 title: z.string(),
 titleZh: z.string(),
 courseTitle: z.string(),
 lessonNumber: z.number(),
 module: moduleSchema,
 isRecent: z.boolean(),
});

export const HomeLearningPulseSchema = z.object({
 trackedCount: z.number().int().nonnegative(),
 reviewCount: z.number().int().nonnegative(),
 knownCount: z.number().int().nonnegative(),
 reviewedTodayCount: z.number().int().nonnegative(),
 bookmarkedCount: z.number().int().nonnegative(),
});

export type HomeDashboardModel = {
 lesson: z.infer<z.ZodNullable<typeof HomeLessonTargetSchema>>;
 learningPulse: z.infer<typeof HomeLearningPulseSchema>;
 recentNotes: NoteListItem[];
 isLoading: boolean;
};
