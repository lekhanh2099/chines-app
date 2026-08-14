import {
 reviewItemSchema,
 type ReviewItem,
 type ReviewRating,
} from "@/features/hanzihome/learning-loop/learning-loop.schemas";

const dayMs = 86_400_000;
const relearnDelayMs = 10 * 60 * 1000;
const stableStreak = 3;

function resolveIntervalDays(item: ReviewItem, rating: ReviewRating): number {
 if (rating === "again") return 0;
 if (rating === "hard") return Math.max(1, item.intervalDays);
 return Math.max(2, item.intervalDays === 0 ? 2 : item.intervalDays * 2);
}

export function scheduleReviewItem(
 item: ReviewItem,
 rating: ReviewRating,
 now = new Date(),
): ReviewItem {
 const success = rating !== "again";
 const intervalDays = resolveIntervalDays(item, rating);
 const nextCorrectStreak = success ? item.correctStreak + 1 : 0;
 const dueAt =
  rating === "again"
   ? new Date(now.getTime() + relearnDelayMs)
   : new Date(now.getTime() + intervalDays * dayMs);

 return reviewItemSchema.parse({
  ...item,
  correctStreak: nextCorrectStreak,
  dueAt: dueAt.toISOString(),
  intervalDays,
  lapseCount: success ? item.lapseCount : item.lapseCount + 1,
  state: nextCorrectStreak >= stableStreak ? "stable" : "learning",
  updatedAt: now.toISOString(),
 });
}
