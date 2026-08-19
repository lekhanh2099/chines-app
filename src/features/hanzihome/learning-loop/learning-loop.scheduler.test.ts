import { describe, expect, it } from "vitest";

import { scheduleLearningLoopItem } from "./learning-loop.scheduler";
import type { LearningLoopItem } from "./learning-loop.schemas";

const now = new Date("2026-08-01T12:00:00.000Z");
const item: LearningLoopItem = {
 id: "review:vocabulary:lesson-1:word-1",
 stableKey: "lesson-1:word-1",
 kind: "vocabulary",
 sourceId: "lesson-1",
 sourceHref: "/hanzihome?lessonId=lesson-1",
 titleZh: "测试",
 titleVi: "Kiểm thử",
 promptZh: "学习",
 pinyin: "xuéxí",
 meaningVi: "học tập",
 userAnswer: "",
 errorKey: "",
 state: "new",
 dueAt: now.toISOString(),
 intervalDays: 0,
 correctStreak: 0,
 lapseCount: 0,
 revision: 0,
 createdAt: now.toISOString(),
 updatedAt: now.toISOString(),
};

describe("scheduleLearningLoopItem", () => {
 it("relearns failed items after a short delay", () => {
  const result = scheduleLearningLoopItem(item, "again", now);
  expect(result.dueAt).toBe("2026-08-01T12:10:00.000Z");
  expect(result.state).toBe("learning");
  expect(result.lapseCount).toBe(1);
  expect(result.revision).toBe(1);
 });

 it("doubles intervals and stabilizes after three successful reviews", () => {
  const first = scheduleLearningLoopItem(item, "good", now);
  const second = scheduleLearningLoopItem(first, "good", now);
  const third = scheduleLearningLoopItem(second, "good", now);
  expect(first.intervalDays).toBe(2);
  expect(second.intervalDays).toBe(4);
  expect(third.intervalDays).toBe(8);
  expect(third.correctStreak).toBe(3);
  expect(third.state).toBe("stable");
 });
});
