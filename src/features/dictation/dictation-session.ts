import { z } from "zod";

import { buildDictationDiff } from "@/features/hanzihome/practice/dictation-comparison";
import { calculateChineseAccuracy } from "@/features/hanzihome/practice/text-comparison";

export const dictationAttemptSchema = z.strictObject({
 entryId: z.string().min(1),
 expectedText: z.string(),
 answer: z.string(),
 score: z.number().int().min(0).max(100),
 mistakeCount: z.number().int().nonnegative(),
 responseMs: z.number().int().nonnegative().nullable(),
});
export type DictationAttempt = z.output<typeof dictationAttemptSchema>;

export function createDictationAttempt(
 entryId: string,
 expectedText: string,
 answer: string,
 responseMs: number | null,
): DictationAttempt {
 const diff = buildDictationDiff(expectedText, answer);
 return dictationAttemptSchema.parse({
  entryId,
  expectedText,
  answer,
  score: calculateChineseAccuracy(expectedText, answer),
  mistakeCount: diff.filter((token) => token.kind !== "match").length,
  responseMs,
 });
}
