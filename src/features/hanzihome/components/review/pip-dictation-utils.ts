import type { DictationDiffToken } from "@/features/hanzihome/practice/dictation-comparison";
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";

export type DictationMode = "zh-to-zh" | "vi-to-zh";

export type AttemptResult = Pick<DictationAttempt, "score" | "responseMs"> & {
 diff: DictationDiffToken[];
};

export type SummaryStats = {
 accuracy: number;
 avgCpm: number;
 perfectCount: number;
 mistakes: HanziHomeVocabItem[];
};

const dictationModeStorageKey = "hanzihome:pip-dictation-mode";

/** Initial dictation mode: explicit prop, then the remembered browser choice, then zh-to-zh. */
export function initialPipDictationMode(initialMode?: DictationMode): DictationMode {
 if (initialMode) return initialMode;
 if (typeof window !== "undefined") {
  try {
   const saved = window.localStorage.getItem(dictationModeStorageKey);
   if (saved === "vi-to-zh" || saved === "zh-to-zh") return saved;
  } catch {
   // Ignore storage errors
  }
 }
 return "zh-to-zh";
}

/** Flips the dictation mode and remembers the new choice. */
export function togglePipDictationMode(prev: DictationMode): DictationMode {
 const next = prev === "zh-to-zh" ? "vi-to-zh" : "zh-to-zh";
 if (typeof window !== "undefined") {
  try {
   window.localStorage.setItem(dictationModeStorageKey, next);
  } catch {
   // Ignore storage errors
  }
 }
 return next;
}

/** Speech rate cycle 1.0x → 1.2x → 0.8x → 1.0x. */
export function nextPipDictationSpeechRate(prev: number) {
 if (prev === 1.0) return 1.2;
 if (prev === 1.2) return 0.8;
 return 1.0;
}

/** Fisher–Yates shuffled index order for `length` items. */
export function shuffledPipDictationIndices(length: number, random: () => number = Math.random) {
 const indices = Array.from({ length }, (_, i) => i);
 for (let i = indices.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  const temp = indices[i];
  indices[i] = indices[j] ?? j;
  indices[j] = temp ?? i;
 }
 return indices;
}

/** Session accuracy, average typing speed and the words that still need review. */
export function pipDictationSummaryStats(
 activeItems: readonly HanziHomeVocabItem[],
 sessionAttempts: ReadonlyMap<number, AttemptResult>,
): SummaryStats {
 const attemptsArray = Array.from(sessionAttempts.values());
 const attemptedCount = attemptsArray.length;
 if (attemptedCount === 0) {
  const emptyMistakes: HanziHomeVocabItem[] = [];
  return {
   accuracy: 100,
   avgCpm: 0,
   perfectCount: 0,
   mistakes: emptyMistakes,
  };
 }

 const totalScore = attemptsArray.reduce((acc, curr) => acc + curr.score, 0);
 const accuracy = Math.round(totalScore / attemptedCount);

 let totalCpm = 0;
 let cpmCount = 0;
 for (const [index, att] of sessionAttempts.entries()) {
  if (att.responseMs && att.responseMs > 0) {
   const chars = activeItems[index]?.hanzi.length ?? 0;
   if (chars === 0) continue;
   const cpm = Math.round((chars / (att.responseMs / 1000)) * 60);
   totalCpm += cpm;
   cpmCount++;
  }
 }
 const avgCpm = cpmCount > 0 ? Math.round(totalCpm / cpmCount) : 0;

 const mistakes: HanziHomeVocabItem[] = [];
 activeItems.forEach((item, idx) => {
  const res = sessionAttempts.get(idx);
  if (!res || res.score < 100) {
   mistakes.push(item);
  }
 });

 return {
  accuracy,
  avgCpm,
  perfectCount: attemptedCount - mistakes.length,
  mistakes,
 };
}
