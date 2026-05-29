import type { MemoryTip } from "./memory-tip.schema";

export function isUserVisibleMemoryTip(tip: MemoryTip) {
  return tip.scope === "user" && tip.sourceType !== "system" && !tip.isArchived;
}

export function getUserVisibleMemoryTips(tips: MemoryTip[]) {
  return tips.filter(isUserVisibleMemoryTip);
}
