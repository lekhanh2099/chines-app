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

export type HomeDashboardModel = {
 lesson: z.infer<z.ZodNullable<typeof HomeLessonTargetSchema>>;
 recentNotes: NoteListItem[];
 isLoading: boolean;
};
