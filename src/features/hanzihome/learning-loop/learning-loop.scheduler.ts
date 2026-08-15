import {
 learningLoopItemSchema,
 type LearningLoopItem,
 type LearningLoopRating,
} from "./learning-loop.schemas";

const dayMs = 86_400_000;
const relearnDelayMs = 10 * 60 * 1000;
const stableStreak = 3;

function resolveIntervalDays(item: LearningLoopItem, rating: LearningLoopRating): number {
 if (rating === "again") return 0;
 if (rating === "hard") return Math.max(1, item.intervalDays);
 return Math.max(2, item.intervalDays === 0 ? 2 : item.intervalDays * 2);
}

export function scheduleLearningLoopItem(
 item: LearningLoopItem,
 rating: LearningLoopRating,
 now = new Date(),
): LearningLoopItem {
 const intervalDays = resolveIntervalDays(item, rating);
 const correctStreak = rating === "again" ? 0 : item.correctStreak + 1;
 const dueAt =
  rating === "again"
   ? new Date(now.getTime() + relearnDelayMs)
   : new Date(now.getTime() + intervalDays * dayMs);

 return learningLoopItemSchema.parse({
  ...item,
  state: correctStreak >= stableStreak ? "stable" : "learning",
  dueAt: dueAt.toISOString(),
  intervalDays,
  correctStreak,
  lapseCount: rating === "again" ? item.lapseCount + 1 : item.lapseCount,
  revision: item.revision + 1,
  updatedAt: now.toISOString(),
 });
}
