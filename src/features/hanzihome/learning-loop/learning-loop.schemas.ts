import { z } from "zod";

export const learningLoopItemKindSchema = z.enum([
 "dictation_mistake",
 "vocabulary",
 "reading_bookmark",
 "shadowing",
 "minimal_contrast",
 "error_correction",
 "sentence_transformation",
 "guided_production",
 "timed_production",
 "delayed_transfer",
]);
export const learningLoopItemStateSchema = z.enum(["new", "learning", "stable"]);
export const learningLoopRatingSchema = z.enum(["again", "hard", "good"]);

export const learningLoopItemSchema = z.strictObject({
 id: z.string().min(1),
 stableKey: z.string().min(1),
 kind: learningLoopItemKindSchema,
 sourceId: z.string().min(1),
 sourceHref: z.string().min(1),
 titleZh: z.string(),
 titleVi: z.string(),
 promptZh: z.string().min(1),
 pinyin: z.string(),
 meaningVi: z.string(),
 userAnswer: z.string(),
 errorKey: z.string(),
 state: learningLoopItemStateSchema,
 dueAt: z.iso.datetime({ offset: true }),
 intervalDays: z.number().int().nonnegative(),
 correctStreak: z.number().int().nonnegative(),
 lapseCount: z.number().int().nonnegative(),
 revision: z.number().int().nonnegative(),
 createdAt: z.iso.datetime({ offset: true }),
 updatedAt: z.iso.datetime({ offset: true }),
});

export const learningEventKindSchema = z.enum(["encountered", "inspected", "review-added"]);
export const learningEventSchema = z.strictObject({
 id: z.uuid(),
 kind: learningEventKindSchema,
 sourceId: z.string().min(1),
 sourceHref: z.string().min(1),
 term: z.string().min(1).max(48),
 contextText: z.string().max(500),
 createdAt: z.iso.datetime({ offset: true }),
});

export type LearningLoopItem = z.output<typeof learningLoopItemSchema>;
export type LearningLoopItemKind = z.output<typeof learningLoopItemKindSchema>;
export type LearningLoopRating = z.output<typeof learningLoopRatingSchema>;
export type LearningEvent = z.output<typeof learningEventSchema>;
