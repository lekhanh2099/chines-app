import type {
 LearningProgressItem,
 ReviewResult,
} from "@/features/hanzihome/types";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function clampStage(level: number) {
 return Math.min(Math.max(Math.trunc(level), 0), 5);
}

function intervalMsForProgress(progress: LearningProgressItem) {
 if (progress.status === "learning") return 10 * MINUTE_MS;
 if (progress.status === "hard") return DAY_MS;
 if (progress.status === "new") return null;

 switch (clampStage(progress.level)) {
  case 0:
  case 1:
   return DAY_MS;
  case 2:
   return 3 * DAY_MS;
  case 3:
   return 7 * DAY_MS;
  case 4:
   return 14 * DAY_MS;
  default:
   return 30 * DAY_MS;
 }
}

export function getReviewDueAt(progress?: LearningProgressItem) {
 if (!progress?.lastReviewedAt) return null;

 const intervalMs = intervalMsForProgress(progress);
 const reviewedAt = Date.parse(progress.lastReviewedAt);
 if (intervalMs === null || !Number.isFinite(reviewedAt)) return null;

 return new Date(reviewedAt + intervalMs).toISOString();
}

export function isReviewDue(progress: LearningProgressItem | undefined, now = new Date()) {
 if (!progress || progress.status === "new") return false;

 if (!progress.lastReviewedAt) {
  return progress.status === "learning" || progress.status === "hard";
 }

 const dueAt = getReviewDueAt(progress);
 return dueAt ? Date.parse(dueAt) <= now.getTime() : false;
}

export function nextScheduledProgress(
 current: LearningProgressItem | undefined,
 result: ReviewResult,
 reviewedAt = new Date(),
): LearningProgressItem {
 const currentStage = clampStage(current?.level ?? 0);
 const lastReviewedAt = reviewedAt.toISOString();

 if (result === "again") {
  return {
   level: 0,
   status: "learning",
   lastReviewedAt,
  };
 }

 if (result === "hard") {
  return {
   level: Math.max(currentStage, 1),
   status: "hard",
   lastReviewedAt,
  };
 }

 return {
  level: Math.min(Math.max(currentStage + 1, 1), 5),
  status: "known",
  lastReviewedAt,
 };
}
