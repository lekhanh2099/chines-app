import { z } from "zod";

export const PracticeSourceSchema = z.enum(["listening", "exercise"]);

export const PracticeProgressItemSchema = z.object({
 source: PracticeSourceSchema,
 lessonId: z.string(),
 itemId: z.string(),
 exerciseType: z.string(),
 attemptCount: z.number().int().nonnegative(),
 correctCount: z.number().int().nonnegative(),
 consecutiveCorrect: z.number().int().nonnegative(),
 masteryScore: z.number().min(0).max(1),
 lastResult: z.boolean(),
 lastAttemptAt: z.string(),
 lastErrorAt: z.string().optional(),
 lastAnswer: z.string().optional(),
});

export const PracticeProgressStateSchema = z.record(z.string(), PracticeProgressItemSchema);

export type PracticeProgressItem = z.infer<typeof PracticeProgressItemSchema>;
export type PracticeProgressState = z.infer<typeof PracticeProgressStateSchema>;
export type PracticeSource = z.infer<typeof PracticeSourceSchema>;

export type PracticeAttemptInput = {
 source: PracticeSource;
 lessonId: string;
 itemId: string;
 exerciseType: string;
 correct: boolean;
 answer?: string;
};

export function getPracticeProgressKey(input: {
 source: PracticeSource;
 lessonId: string;
 itemId: string;
}) {
 return `${input.source}:${input.lessonId}:${input.itemId}`;
}

export function nextPracticeProgress(
 current: PracticeProgressItem | undefined,
 input: PracticeAttemptInput,
 attemptedAt = new Date(),
): PracticeProgressItem {
 const attemptCount = (current?.attemptCount ?? 0) + 1;
 const correctCount = (current?.correctCount ?? 0) + (input.correct ? 1 : 0);
 const masteryScore = Math.round((correctCount / attemptCount) * 1000) / 1000;

 return {
  source: input.source,
  lessonId: input.lessonId,
  itemId: input.itemId,
  exerciseType: input.exerciseType,
  attemptCount,
  correctCount,
  consecutiveCorrect: input.correct ? (current?.consecutiveCorrect ?? 0) + 1 : 0,
  masteryScore,
  lastResult: input.correct,
  lastAttemptAt: attemptedAt.toISOString(),
  lastErrorAt: input.correct ? current?.lastErrorAt : attemptedAt.toISOString(),
  lastAnswer: input.answer,
 };
}

export function isWeakPracticeProgress(item: PracticeProgressItem) {
 if (item.attemptCount === 0) return false;
 if (!item.lastResult) return true;
 if (item.lastErrorAt) return item.consecutiveCorrect < 2;

 return item.attemptCount >= 3 && item.masteryScore < 0.7;
}
