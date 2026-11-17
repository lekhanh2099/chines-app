import { describe, expect, it } from "vitest";

import {
 ExerciseSchema,
 ReadingItemSchema,
} from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import {
 buildQuestionExerciseModel,
 questionHasInlineAnswer,
 resolveReferencedReadingItem,
} from "./question-exercise-model";

function readingItem(id: string, order: number) {
 return ReadingItemSchema.parse({ id, type: "reading_note", order, title: id });
}

describe("questionHasInlineAnswer", () => {
 it("detects inline answer fields and multi-value tuples", () => {
  expect(questionHasInlineAnswer({ prompt: "Q", answer: "A" })).toBe(true);
  expect(questionHasInlineAnswer({ prompt: "Q", answer: { zh: "答" } })).toBe(true);
  expect(questionHasInlineAnswer({ prompt: "Q", acceptable_answers: ["A"] })).toBe(true);
  expect(questionHasInlineAnswer(["Q", "A"])).toBe(true);
  expect(questionHasInlineAnswer({ prompt: "Q" })).toBe(false);
 });
});

describe("resolveReferencedReadingItem", () => {
 const items = [readingItem("r-a", 1), readingItem("r-b", 2), readingItem("r-c", 2)];

 it("prefers an exact id match", () => {
  expect(resolveReferencedReadingItem(items, undefined, "r-b")?.id).toBe("r-b");
 });

 it("resolves reading_<order> only when the order is unique", () => {
  expect(resolveReferencedReadingItem(items, undefined, "reading_1")?.id).toBe("r-a");
  expect(resolveReferencedReadingItem(items, undefined, "reading_2")).toBeUndefined();
 });

 it("returns undefined for an empty or unrecognised reference", () => {
  expect(resolveReferencedReadingItem(items, undefined, "")).toBeUndefined();
  expect(resolveReferencedReadingItem(items, undefined, "unknown")).toBeUndefined();
 });
});

describe("buildQuestionExerciseModel", () => {
 it("skips the aggregate answer key when every question carries its own answer", () => {
  const item = ExerciseSchema.parse({
   id: "ex-1",
   type: "short_answer",
   order: 1,
   title: "Trả lời",
   questions: [{ prompt: "你好吗？", answer: "我很好" }],
   answer_key: [],
  });

  const model = buildQuestionExerciseModel({ item });

  expect(model.questions).toHaveLength(1);
  expect(model.isReadingCloze).toBe(false);
  expect(model.shouldRenderAggregateAnswerKey).toBe(false);
  expect(model.hasStructuredPayload).toBe(true);
 });
});
