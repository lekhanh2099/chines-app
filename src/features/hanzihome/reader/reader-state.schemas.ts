import { z } from "zod";

import { JsonObjectSchema } from "@/types/json";

import { readerAnswersSchema } from "./reader.schemas";
import { learningLoopItemKindSchema } from "../learning-loop/learning-loop.schemas";

export const readerProgressRowSchema = z.object({
 user_id: z.uuid(),
 document_id: z.string().min(1),
 completed: z.boolean(),
 answers: readerAnswersSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const personalLearningStateRowSchema = z.strictObject({
 user_id: z.uuid(),
 node_id: z.string().min(1),
 state: JsonObjectSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const dailyReadingStateRowSchema = z.strictObject({
 user_id: z.uuid(),
 published_date: z.iso.date(),
 state: JsonObjectSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerFeatureStateSchema = z.object({
 completed: z.boolean(),
 answers: readerAnswersSchema,
});

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

export const learningLoopItemRowSchema = z.strictObject({
 user_id: z.uuid(),
 id: z.string().min(1),
 stable_key: z.string().min(1),
 kind: learningLoopItemKindSchema,
 source_id: z.string().min(1),
 source_href: z.string().min(1),
 title_zh: z.string(),
 title_vi: z.string(),
 prompt_zh: z.string().min(1),
 pinyin: z.string(),
 meaning_vi: z.string(),
 user_answer: z.string(),
 error_key: z.string(),
 state: z.enum(["new", "learning", "stable"]),
 due_at: z.iso.datetime({ offset: true }),
 interval_days: z.number().int().nonnegative(),
 correct_streak: z.number().int().nonnegative(),
 lapse_count: z.number().int().nonnegative(),
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export type ReaderProgressRow = z.output<typeof readerProgressRowSchema>;
export type PersonalLearningStateRow = z.output<typeof personalLearningStateRowSchema>;
export type DailyReadingStateRow = z.output<typeof dailyReadingStateRowSchema>;
export type PracticeAttemptSurface = z.output<typeof practiceAttemptSurfaceSchema>;
export type PracticeAttemptRow = z.output<typeof practiceAttemptRowSchema>;
export type LearningLoopItemRow = z.output<typeof learningLoopItemRowSchema>;
