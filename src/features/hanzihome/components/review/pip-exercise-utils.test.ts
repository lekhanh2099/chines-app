import { describe, expect, it } from "vitest";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { getTargetAnswer } from "./pip-exercise-utils";

function exerciseItem(interaction: UniversalExerciseItem["interaction"]): UniversalExerciseItem {
 return { id: "q1", category: "custom", prompt: "Prompt", interaction };
}

describe("getTargetAnswer", () => {
 it("returns the expected cloze answer", () => {
  expect(getTargetAnswer(exerciseItem({ type: "cloze", expectedAnswer: "你好" }))).toBe("你好");
 });

 it("labels the correct choice, falling back to the bare key", () => {
  const options = [
   { key: "A", label: "苹果" },
   { key: "B", label: "香蕉" },
  ];
  expect(getTargetAnswer(exerciseItem({ type: "choice", options, correctKey: "B" }))).toBe(
   "B. 香蕉",
  );
  expect(getTargetAnswer(exerciseItem({ type: "choice", options, correctKey: "C" }))).toBe("C");
 });

 it("joins the reorder sequence with spaces", () => {
  expect(
   getTargetAnswer(
    exerciseItem({ type: "reorder", tokens: ["好", "你"], correctOrder: ["你", "好"] }),
   ),
  ).toBe("你 好");
 });

 it("returns the suggested open answer", () => {
  expect(getTargetAnswer(exerciseItem({ type: "open", suggestedAnswer: "我很好" }))).toBe("我很好");
 });
});
