import * as z from "zod";

export const learningActivitySchema = z.enum([
 "reading",
 "dictation",
 "shadowing",
 "translation",
 "vocabulary",
]);

export const learningSessionStatusSchema = z.enum(["active", "paused", "completed"]);

export const learningSessionSchema = z.strictObject({
 id: z.string().min(1),
 activity: learningActivitySchema,
 sourceId: z.string().min(1),
 href: z.string().min(1),
 titleZh: z.string(),
 titleVi: z.string(),
 positionLabel: z.string(),
 position: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
 progressCurrent: z.number().int().nonnegative(),
 progressTotal: z.number().int().nonnegative(),
 status: learningSessionStatusSchema,
 startedAt: z.string().datetime(),
 updatedAt: z.string().datetime(),
});

export const reviewItemKindSchema = z.enum([
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

export const reviewItemStateSchema = z.enum(["new", "learning", "stable"]);

export const reviewItemSchema = z.strictObject({
 id: z.string().min(1),
 kind: reviewItemKindSchema,
 sourceId: z.string().min(1),
 sourceHref: z.string().min(1),
 titleZh: z.string(),
 titleVi: z.string(),
 promptZh: z.string().min(1),
 pinyin: z.string(),
 meaningVi: z.string(),
 userAnswer: z.string(),
 errorKey: z.string(),
 state: reviewItemStateSchema,
 dueAt: z.string().datetime(),
 intervalDays: z.number().int().nonnegative(),
 correctStreak: z.number().int().nonnegative(),
 lapseCount: z.number().int().nonnegative(),
 createdAt: z.string().datetime(),
 updatedAt: z.string().datetime(),
});

export const reviewRatingSchema = z.enum(["again", "hard", "good"]);

export const learningEventKindSchema = z.enum(["encountered", "inspected", "review-added"]);

export const learningEventSchema = z.strictObject({
 id: z.string().min(1),
 kind: learningEventKindSchema,
 sourceId: z.string().min(1),
 sourceHref: z.string().min(1),
 term: z.string().min(1).max(48),
 contextText: z.string().max(500),
 createdAt: z.string().datetime(),
});

export const learningLoopStateSchema = z.strictObject({
 latestSession: learningSessionSchema.nullable(),
 reviewItems: z.array(reviewItemSchema).max(5_000),
 events: z.array(learningEventSchema).max(5_000),
});

export type LearningActivity = z.output<typeof learningActivitySchema>;
export type LearningSession = z.output<typeof learningSessionSchema>;
export type LearningSessionStatus = z.output<typeof learningSessionStatusSchema>;
export type ReviewItem = z.output<typeof reviewItemSchema>;
export type ReviewItemKind = z.output<typeof reviewItemKindSchema>;
export type ReviewRating = z.output<typeof reviewRatingSchema>;
export type LearningEvent = z.output<typeof learningEventSchema>;
export type LearningEventKind = z.output<typeof learningEventKindSchema>;
export type LearningLoopState = z.output<typeof learningLoopStateSchema>;

export const emptyLearningLoopState: LearningLoopState = {
 latestSession: null,
 reviewItems: [],
 events: [],
};
