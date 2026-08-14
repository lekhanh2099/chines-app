import { z } from "zod";

import {
 moduleSchema,
 reviewResultSchema,
} from "@/features/hanzihome/schemas/learning-state.schema";
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
 dueCount: z.number().int().nonnegative(),
 weakPracticeCount: z.number().int().nonnegative(),
 knownCount: z.number().int().nonnegative(),
 reviewedTodayCount: z.number().int().nonnegative(),
 bookmarkedCount: z.number().int().nonnegative(),
});

export const HomeRecentActivityItemSchema = z.object({
 key: z.string(),
 label: z.string(),
 kindLabel: z.string(),
 result: reviewResultSchema,
 answeredAt: z.string(),
});

export type HomeDashboardModel = {
 lesson: z.infer<z.ZodNullable<typeof HomeLessonTargetSchema>>;
 learningPulse: z.infer<typeof HomeLearningPulseSchema>;
 recentActivity: Array<z.infer<typeof HomeRecentActivityItemSchema>>;
 recentNotes: NoteListItem[];
 isLoading: boolean;
};
