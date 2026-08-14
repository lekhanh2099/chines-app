import { describe, expect, it } from "vitest";

import {
 isWeakPracticeProgress,
 nextPracticeProgress,
 PracticeSourceSchema,
} from "./practice-progress";

const baseAttempt = {
 source: PracticeSourceSchema.enum.listening,
 lessonId: "lesson-1",
 itemId: "item-1",
 exerciseType: "single_choice",
};

describe("practice progress", () => {
 it("records a first error as a weak item", () => {
  const progress = nextPracticeProgress(
   undefined,
   { ...baseAttempt, correct: false, answer: "B" },
   new Date("2026-08-14T00:00:00.000Z"),
  );

  expect(progress.attemptCount).toBe(1);
  expect(progress.correctCount).toBe(0);
  expect(progress.masteryScore).toBe(0);
  expect(progress.lastAnswer).toBe("B");
  expect(progress.lastErrorAt).toBe("2026-08-14T00:00:00.000Z");
  expect(isWeakPracticeProgress(progress)).toBe(true);
 });

 it("preserves the last error while a later correct answer starts recovery", () => {
  const first = nextPracticeProgress(
   undefined,
   { ...baseAttempt, correct: false },
   new Date("2026-08-14T00:00:00.000Z"),
  );
  const second = nextPracticeProgress(
   first,
   { ...baseAttempt, correct: true },
   new Date("2026-08-14T00:05:00.000Z"),
  );

  expect(second.attemptCount).toBe(2);
  expect(second.correctCount).toBe(1);
  expect(second.consecutiveCorrect).toBe(1);
  expect(second.masteryScore).toBe(0.5);
  expect(second.lastErrorAt).toBe("2026-08-14T00:00:00.000Z");
  expect(isWeakPracticeProgress(second)).toBe(false);
 });

 it("keeps a repeatedly unstable item weak until it has a recovery streak", () => {
  const unstable = {
   source: PracticeSourceSchema.enum.listening,
   lessonId: baseAttempt.lessonId,
   itemId: baseAttempt.itemId,
   exerciseType: baseAttempt.exerciseType,
   attemptCount: 4,
   correctCount: 2,
   consecutiveCorrect: 1,
   masteryScore: 0.5,
   lastResult: true,
   lastAttemptAt: "2026-08-14T00:10:00.000Z",
   lastErrorAt: "2026-08-14T00:05:00.000Z",
  };

  expect(isWeakPracticeProgress(unstable)).toBe(true);
  expect(isWeakPracticeProgress({ ...unstable, consecutiveCorrect: 2 })).toBe(false);
 });
});
