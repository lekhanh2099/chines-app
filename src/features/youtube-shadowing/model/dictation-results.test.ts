import { describe, expect, it } from "vitest";

import {
 findResultIndex,
 scoresBySegment,
 summarizeResults,
 upsertResult,
 type VideoDictationResult,
} from "./dictation-results";

describe("dictation-results", () => {
 it("inserts new results and updates existing ones without duplicates", () => {
  const first: VideoDictationResult = { segmentIndex: 0, answer: "你好", score: 100 };
  const second: VideoDictationResult = { segmentIndex: 2, answer: "谢谢", score: 50 };
  const afterInsert = upsertResult(upsertResult([], first), second);

  expect(afterInsert).toEqual([first, second]);
  expect(findResultIndex(afterInsert, 0)).toBe(0);
  expect(findResultIndex(afterInsert, 1)).toBe(-1);
  expect(findResultIndex(afterInsert, 2)).toBe(1);

  const updatedSecond: VideoDictationResult = { segmentIndex: 2, answer: "谢谢你", score: 100 };
  const afterUpdate = upsertResult(afterInsert, updatedSecond);
  expect(afterUpdate).toEqual([first, updatedSecond]);
 });

 it("maps segment scores with -1 for unattempted lines and ignores out-of-range indices", () => {
  const results: VideoDictationResult[] = [
   { segmentIndex: 0, answer: "早上好", score: 100 },
   { segmentIndex: 2, answer: "我是", score: 67 },
   { segmentIndex: 5, answer: "越界", score: 80 },
  ];

  expect(scoresBySegment(results, 4)).toEqual([100, -1, 67, -1]);
  expect(scoresBySegment(results, 0)).toEqual([]);
 });

 it("summarizes attempted count and rounded integer average score", () => {
  expect(summarizeResults([])).toEqual({ attempted: 0, averageScore: 0 });
  expect(
   summarizeResults([
    { segmentIndex: 0, answer: "a", score: 100 },
    { segmentIndex: 1, answer: "b", score: 67 },
    { segmentIndex: 2, answer: "c", score: 80 },
   ]),
  ).toEqual({ attempted: 3, averageScore: 82 });
 });
});
