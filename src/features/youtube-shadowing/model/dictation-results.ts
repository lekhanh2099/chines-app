import { z } from "zod";

export const videoDictationResultSchema = z.strictObject({
 segmentIndex: z.number().int().nonnegative(),
 answer: z.string(),
 score: z.number().int().min(0).max(100),
});
export type VideoDictationResult = z.infer<typeof videoDictationResultSchema>;

export function findResultIndex(results: VideoDictationResult[], segmentIndex: number): number {
 return results.findIndex((item) => item.segmentIndex === segmentIndex);
}

export function upsertResult(
 results: VideoDictationResult[],
 next: VideoDictationResult,
): VideoDictationResult[] {
 const existingIndex = findResultIndex(results, next.segmentIndex);
 if (existingIndex < 0) return [...results, next];
 return results.map((item, index) => (index === existingIndex ? next : item));
}

export function scoresBySegment(results: VideoDictationResult[], segmentCount: number): number[] {
 const scores = Array.from({ length: Math.max(0, segmentCount) }, () => -1);
 for (const item of results) {
  if (item.segmentIndex >= 0 && item.segmentIndex < scores.length) {
   scores[item.segmentIndex] = item.score;
  }
 }
 return scores;
}

export function summarizeResults(results: VideoDictationResult[]): {
 attempted: number;
 averageScore: number;
} {
 const attempted = results.length;
 if (attempted === 0) return { attempted: 0, averageScore: 0 };
 const total = results.reduce((sum, item) => sum + item.score, 0);
 return {
  attempted,
  averageScore: Math.round(total / attempted),
 };
}
