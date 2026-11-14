import type { LearningLoopItemRow } from "./learning-loop-api";

export function restoreLearningLoopItem(
 current: LearningLoopItemRow[],
 targetItem: LearningLoopItemRow,
 targetIndex: number,
): LearningLoopItemRow[] {
 if (current.some((item) => item.id === targetItem.id)) return current;
 const copy = [...current];
 const insertAt =
  typeof targetIndex === "number" && targetIndex >= 0 && targetIndex <= copy.length
   ? targetIndex
   : 0;
 copy.splice(insertAt, 0, targetItem);
 return copy;
}
