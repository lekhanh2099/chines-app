import { describe, expect, it } from "vitest";

import type { ReviewItem } from "@/features/hanzihome/learning-loop/learning-loop.schemas";
import { scheduleReviewItem } from "@/features/hanzihome/learning-loop/learning-loop.scheduler";

const now = new Date("2026-08-01T12:00:00.000Z");
const item: ReviewItem = {
 id: "review:vocabulary:lesson-1:word-1",
 kind: "vocabulary",
 sourceId: "lesson-1",
 sourceHref: "/hanzihome?lesson=1",
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
 createdAt: now.toISOString(),
 updatedAt: now.toISOString(),
};

describe("scheduleReviewItem", () => {
 it("schedules a failed item for relearning without a day interval", () => {
  const result = scheduleReviewItem(item, "again", now);

  expect(result.dueAt).toBe("2026-08-01T12:10:00.000Z");
  expect(result.intervalDays).toBe(0);
  expect(result.correctStreak).toBe(0);
  expect(result.lapseCount).toBe(1);
  expect(result.state).toBe("learning");
 });

 it("grows the interval and reaches stable after three successful reviews", () => {
  const first = scheduleReviewItem(item, "good", now);
  const second = scheduleReviewItem(first, "good", now);
  const third = scheduleReviewItem(second, "good", now);

  expect(first.intervalDays).toBe(2);
  expect(second.intervalDays).toBe(4);
  expect(third.intervalDays).toBe(8);
  expect(third.correctStreak).toBe(3);
  expect(third.state).toBe("stable");
 });
});
