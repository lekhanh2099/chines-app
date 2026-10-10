import { describe, expect, it } from "vitest";
import type { ReaderHumanitiesEvaluation } from "@/features/humanities/model/humanities-exercise.schemas";
import type { TranslationSegment } from "@/features/hanzihome/practice/translation-practice";
import {
 createTranslationSubmission,
 createTranslationRecordingSubmission,
 createTranslationRevisionSubmission,
 createTranslationSelfMarkSubmission,
 translationCourseModuleOrder,
 advanceTranslationPreparation,
 translationPreparationRemaining,
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
 it("preserves the learner revision and complete self-mark payload without changing the source", () => {
  const context: Parameters<typeof createTranslationRevisionSubmission>[0] = {
   contentId: "second",
   direction: "vi-zh",
  };
  const marks: Parameters<typeof createTranslationSelfMarkSubmission>[1] = {
   time: "kept",
   place: "partial",
  };
  expect(createTranslationRevisionSubmission(context, "  星期四\n九点  ")).toEqual({
   surface: "translation",
   contentId: "second",
   direction: "vi-zh",
   answer: { answer: "  星期四\n九点  ", reference: null, missingUnitIds: [] },
   scorePercent: null,
   responseMs: null,
  });
  expect(createTranslationSelfMarkSubmission(context, marks)).toEqual({
   surface: "translation",
   contentId: "second",
   direction: "vi-zh",
   answer: { kind: "interpreting-self-mark", unitMarks: { time: "kept", place: "partial" } },
   scorePercent: null,
   responseMs: null,
  });
  expect(context).toEqual({ contentId: "second", direction: "vi-zh" });
  expect(marks).toEqual({ time: "kept", place: "partial" });
 });
 it("builds the complete recording payload from the captured source and preserves learner fields", () => {
  const context = { contentId: segment.id, direction: evaluation.direction };
  const answer: Parameters<typeof createTranslationRecordingSubmission>[1] = {
   transcript: "  Lời dịch của tôi  ",
   notes: "9h — thứ Năm",
   unitMarks: { time: "partial", place: "unsure" },
   durationSeconds: 7,
  };
  expect(createTranslationRecordingSubmission(context, answer)).toEqual({
   surface: "translation",
   contentId: "segment-1",
   direction: "zh-vi",
   answer: {
    kind: "interpreting-recording",
    transcript: "  Lời dịch của tôi  ",
    notes: "9h — thứ Năm",
    unitMarks: { time: "partial", place: "unsure" },
    durationSeconds: 7,
   },
   scorePercent: null,
   responseMs: 7000,
  });
  expect(context).toEqual({ contentId: "segment-1", direction: "zh-vi" });
  expect(answer.durationSeconds).toBe(7);
  expect(answer.unitMarks).toEqual({ time: "partial", place: "unsure" });
  expect(
   createTranslationRecordingSubmission(
    { contentId: "second", direction: "vi-zh" },
    { transcript: "", notes: "", unitMarks: {}, durationSeconds: 0 },
   ),
  ).toEqual({
   surface: "translation",
   contentId: "second",
   direction: "vi-zh",
   answer: {
    kind: "interpreting-recording",
    transcript: "",
    notes: "",
    unitMarks: {},
    durationSeconds: 0,
   },
   scorePercent: null,
   responseMs: 0,
  });
 });
 it("uses the current preparation key, decrements once, and stops at zero", () => {
  const prior = { key: "first:zh-vi", remaining: 2 };
  expect(translationPreparationRemaining(prior, "first:zh-vi", 3)).toBe(2);
  expect(translationPreparationRemaining(prior, "second:zh-vi", 3)).toBe(3);
  expect(translationPreparationRemaining(prior, "first:vi-zh", 0)).toBe(0);
  expect(advanceTranslationPreparation(prior, "first:zh-vi", 3)).toEqual({
   key: "first:zh-vi",
   remaining: 1,
  });
  expect(advanceTranslationPreparation(prior, "second:zh-vi", 3)).toEqual({
   key: "second:zh-vi",
   remaining: 2,
  });
  expect(
   advanceTranslationPreparation({ key: "first:zh-vi", remaining: 0 }, "first:zh-vi", 3),
  ).toEqual({ key: "first:zh-vi", remaining: 0 });
  expect(prior).toEqual({ key: "first:zh-vi", remaining: 2 });
 });
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
