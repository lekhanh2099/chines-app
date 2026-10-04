import { describe, expect, it } from "vitest";
import type { ReaderHumanitiesEvaluation } from "@/features/humanities/model/humanities-exercise.schemas";
import type { TranslationSegment } from "@/features/hanzihome/practice/translation-practice";
import {
 createTranslationSubmission,
 translationCourseModuleOrder,
} from "./translation-workspace-utils";

const segment: TranslationSegment = {
 id: "segment-1",
 order: 1,
 sourceLabel: "Test",
 zh: "星期四早上九点",
 vi: "9 giờ sáng thứ năm",
 pinyin: "",
};
const evaluation: ReaderHumanitiesEvaluation = {
 mode: "translation",
 direction: "zh-vi",
 informationUnits: [
  {
   id: "time",
   type: "time",
   canonicalMeaningVi: "9 giờ sáng thứ Năm",
   required: true,
   weight: 1,
   acceptedRealizations: ["9 giờ sáng thứ năm"],
  },
 ],
 rubric: [{ id: "terms", labelVi: "Thuật ngữ", weight: 100, deterministic: true }],
 references: [{ id: "reference", text: "Sáng thứ Năm lúc 9 giờ" }],
 preparationSeconds: null,
 maxRecordingSeconds: null,
 replayPolicy: null,
 replayLimit: null,
 noteTakingAllowed: null,
};

describe("translation workspace policies", () => {
 it("preserves both course module boundary mappings", () => {
  expect(
   [1, 2, 6, 7, 10, 11, 15, 16].map((index) => translationCourseModuleOrder("translation", index)),
  ).toEqual([1, 6, 6, 7, 7, 8, 8, 9]);
  expect(
   [1, 2, 3, 4, 5, 6].map((index) => translationCourseModuleOrder("interpreting", index)),
  ).toEqual([1, 10, 10, 11, 11, 12]);
 });
 it("uses the direction reference and score when there is no Humanities evaluator", () => {
  const { payload, evaluationResult } = createTranslationSubmission(
   segment,
   "vi-zh",
   segment.zh,
   2000,
   undefined,
  );
  expect(payload).toEqual({
   surface: "translation",
   contentId: "segment-1",
   direction: "vi-zh",
   answer: { answer: segment.zh, reference: segment.zh, missingUnitIds: [] },
   scorePercent: 100,
   responseMs: 2000,
  });
  expect(evaluationResult).toBeNull();
 });
 it("persists independently expected required-unit results and the authoritative reference", () => {
  const covered = createTranslationSubmission(
   segment,
   "zh-vi",
   "9 giờ sáng thứ năm",
   null,
   evaluation,
  );
  expect(covered.payload.scorePercent).toBe(100);
  expect(covered.payload.answer).toEqual({
   answer: "9 giờ sáng thứ năm",
   reference: "Sáng thứ Năm lúc 9 giờ",
   missingUnitIds: [],
  });
  const missed = createTranslationSubmission(segment, "zh-vi", "Sáng thứ sáu", null, evaluation);
  expect(missed.payload.scorePercent).toBe(0);
  expect(missed.payload.answer?.missingUnitIds).toEqual(["time"]);
 });
});
