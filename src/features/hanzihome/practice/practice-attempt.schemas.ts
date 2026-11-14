import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";
export const practiceAttemptSurfaceSchema = z.enum([
 "reader",
 "dictation",
 "translation",
 "listening",
 "personal-learning",
 "shadowing",
 "review",
]);

export const practiceAttemptRowSchema = z.strictObject({
 id: z.uuid(),
 user_id: z.uuid(),
 surface: practiceAttemptSurfaceSchema,
 content_id: z.string().min(1),
 direction: z.string().min(1).nullable(),
 answer: JsonObjectSchema,
 score: z.number().min(0).max(1).nullable(),
 response_ms: z.number().int().nonnegative().nullable(),
 created_at: z.iso.datetime({ offset: true }),
});

export type PracticeAttemptSurface = z.output<typeof practiceAttemptSurfaceSchema>;
export type PracticeAttemptRow = z.output<typeof practiceAttemptRowSchema>;
