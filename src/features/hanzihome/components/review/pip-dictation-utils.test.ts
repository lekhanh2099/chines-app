import { describe, expect, it } from "vitest";
import { textbookLessonToReviewLesson } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 type AttemptResult,
 initialPipDictationMode,
 nextPipDictationSpeechRate,
 pipDictationSummaryStats,
 shuffledPipDictationIndices,
} from "./pip-dictation-utils";

function result(score: number, responseMs: number): AttemptResult {
 return { score, responseMs, diff: [] };
}

describe("pip dictation helpers", () => {
 it("prefers the explicit initial mode", () => {
  expect(initialPipDictationMode("vi-to-zh")).toBe("vi-to-zh");
  expect(initialPipDictationMode("zh-to-zh")).toBe("zh-to-zh");
 });

 it("cycles speech rate 1.0 → 1.2 → 0.8 → 1.0", () => {
  expect(nextPipDictationSpeechRate(1.0)).toBe(1.2);
  expect(nextPipDictationSpeechRate(1.2)).toBe(0.8);
  expect(nextPipDictationSpeechRate(0.8)).toBe(1.0);
 });

 it("returns a permutation of every index", () => {
  const order = shuffledPipDictationIndices(6, () => 0);
  expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(order).toEqual([1, 2, 3, 4, 5, 0]);
  expect(shuffledPipDictationIndices(0)).toEqual([]);
 });

 it("summarises accuracy, typing speed and remaining mistakes", () => {
  const lesson = getTextbookLesson("nhip-cau", 5);
  if (lesson === null) throw new Error("fixture lesson missing");
  const items = textbookLessonToReviewLesson(lesson).vocab.slice(0, 3);
  const [first, second, third] = items;
  if (!first || !second || !third) throw new Error("fixture vocab missing");

  expect(pipDictationSummaryStats(items, new Map())).toEqual({
   accuracy: 100,
   avgCpm: 0,
   perfectCount: 0,
   mistakes: [],
  });

  const stats = pipDictationSummaryStats(
   items,
   new Map([
    [0, result(100, 1000)],
    [1, result(50, 0)],
   ]),
  );
  expect(stats.accuracy).toBe(75);
  expect(stats.avgCpm).toBe(first.hanzi.length * 60);
  expect(stats.mistakes).toEqual([second, third]);
  expect(stats.perfectCount).toBe(0);
 });
});
