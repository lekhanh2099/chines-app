import { describe, expect, it } from "vitest";

import {
 getReviewDueAt,
 isReviewDue,
 nextScheduledProgress,
} from "./review-scheduler";

describe("review scheduler", () => {
 it("does not put untouched items into the due queue", () => {
  expect(isReviewDue(undefined, new Date("2026-08-14T00:00:00.000Z"))).toBe(false);
  expect(
   isReviewDue(
    { level: 0, status: "new" },
    new Date("2026-08-14T00:00:00.000Z"),
   ),
  ).toBe(false);
 });

 it("keeps legacy learning and hard items reviewable when they have no timestamp", () => {
  const now = new Date("2026-08-14T00:00:00.000Z");

  expect(isReviewDue({ level: 1, status: "learning" }, now)).toBe(true);
  expect(isReviewDue({ level: 1, status: "hard" }, now)).toBe(true);
 });

 it("derives the due date from the persisted level and last review time", () => {
  const progress = {
   level: 3,
   status: "known" as const,
   lastReviewedAt: "2026-08-01T00:00:00.000Z",
  };

  expect(getReviewDueAt(progress)).toBe("2026-08-08T00:00:00.000Z");
  expect(isReviewDue(progress, new Date("2026-08-07T23:59:59.999Z"))).toBe(false);
  expect(isReviewDue(progress, new Date("2026-08-08T00:00:00.000Z"))).toBe(true);
 });

 it("advances a known answer by one stage without inventing a second state owner", () => {
  const reviewedAt = new Date("2026-08-14T00:00:00.000Z");
  const progress = nextScheduledProgress(undefined, "known", reviewedAt);

  expect(progress).toEqual({
   level: 1,
   status: "known",
   lastReviewedAt: "2026-08-14T00:00:00.000Z",
  });
  expect(getReviewDueAt(progress)).toBe("2026-08-15T00:00:00.000Z");
 });

 it("resets again answers to a short relearning interval", () => {
  const progress = nextScheduledProgress(
   {
    level: 4,
    status: "known",
    lastReviewedAt: "2026-08-01T00:00:00.000Z",
   },
   "again",
   new Date("2026-08-14T00:00:00.000Z"),
  );

  expect(progress.level).toBe(0);
  expect(progress.status).toBe("learning");
  expect(getReviewDueAt(progress)).toBe("2026-08-14T00:10:00.000Z");
 });

 it("keeps hard answers at their current stage and reviews them the next day", () => {
  const progress = nextScheduledProgress(
   {
    level: 3,
    status: "known",
    lastReviewedAt: "2026-08-01T00:00:00.000Z",
   },
   "hard",
   new Date("2026-08-14T00:00:00.000Z"),
  );

  expect(progress.level).toBe(3);
  expect(progress.status).toBe("hard");
  expect(getReviewDueAt(progress)).toBe("2026-08-15T00:00:00.000Z");
 });
});
