import { describe, expect, it } from "vitest";

import { emptyLearningLoopState } from "@/features/hanzihome/learning-loop/learning-loop.schemas";
import {
 addReviewItemInState,
 rateReviewItemInState,
 recordLearningSessionInState,
} from "@/features/hanzihome/learning-loop/learning-loop.state";

const now = new Date("2026-08-01T12:00:00.000Z");

describe("learning-loop state", () => {
 it("preserves the session id and start time when the same source resumes", () => {
  const first = recordLearningSessionInState(
   emptyLearningLoopState,
   { activity: "reading", sourceId: "lesson-1", href: "/hanzihome?lesson=1" },
   "session-1",
   now,
  );
  const resumed = recordLearningSessionInState(
   first,
   {
    activity: "reading",
    sourceId: "lesson-1",
    href: "/hanzihome?lesson=1",
    progressCurrent: 4,
    progressTotal: 10,
   },
   "unused-session-id",
   new Date("2026-08-01T12:05:00.000Z"),
  );

  expect(resumed.latestSession?.id).toBe("session-1");
  expect(resumed.latestSession?.startedAt).toBe(now.toISOString());
  expect(resumed.latestSession?.progressCurrent).toBe(4);
 });

 it("uses a stable review id and records a lapse when the same item is re-added", () => {
  const first = addReviewItemInState(
   emptyLearningLoopState,
   {
    stableKey: "lesson-1:word-1",
    kind: "vocabulary",
    sourceId: "lesson-1",
    sourceHref: "/hanzihome?lesson=1",
    promptZh: "学习",
   },
   now,
  );
  const second = addReviewItemInState(
   first,
   {
    stableKey: "lesson-1:word-1",
    kind: "vocabulary",
    sourceId: "lesson-1",
    sourceHref: "/hanzihome?lesson=1",
    promptZh: "学习",
   },
   new Date("2026-08-02T12:00:00.000Z"),
  );

  expect(second.reviewItems).toHaveLength(1);
  expect(second.reviewItems[0]?.id).toBe("review:vocabulary:lesson-1:word-1");
  expect(second.reviewItems[0]?.lapseCount).toBe(1);
 });

 it("rates review items through the source scheduler semantics", () => {
  const state = addReviewItemInState(
   emptyLearningLoopState,
   {
    stableKey: "lesson-1:word-1",
    kind: "vocabulary",
    sourceId: "lesson-1",
    sourceHref: "/hanzihome?lesson=1",
    promptZh: "学习",
   },
   now,
  );
  const rated = rateReviewItemInState(state, "review:vocabulary:lesson-1:word-1", "good", now);

  expect(rated.reviewItems[0]?.intervalDays).toBe(2);
  expect(rated.reviewItems[0]?.correctStreak).toBe(1);
 });
});
