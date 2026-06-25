import { describe, expect, it } from "vitest";

import { hasExercisePassagePayload } from "./exercise-utils";
import { buildExerciseQuestionViewModel } from "./question-view-model";

describe("buildExerciseQuestionViewModel", () => {
 it("maps legacy choose-word tuples", () => {
  const model = buildExerciseQuestionViewModel({
   exerciseType: "choose_words_fill_blank",
   value: ["ex03_q01", "我家的花儿都让我养得______的。", "半死不活"],
   index: 0,
  });

  expect(model.id).toBe("ex03_q01");
  expect(model.title).toContain("花儿");
  expect(model.answer).toBe("半死不活");
 });

 it("maps legacy correction tuples as wrong and corrected sentences", () => {
  const model = buildExerciseQuestionViewModel({
   exerciseType: "correct_sentence",
   value: ["老师不料没来。", "不料老师没来。"],
   index: 0,
  });

  expect(model.title).toBe("老师不料没来。");
  expect(model.answer).toBe("不料老师没来。");
 });

 it("keeps dialogue lines and given words for complete-dialogue exercises", () => {
  const model = buildExerciseQuestionViewModel({
   exerciseType: "complete_dialogue",
   value: {
    id: "dialogue-1",
    dialogue: ["A：这是你养的花儿啊？", "B：____________________。"],
    given_words: ["半死不活"],
    sample_answer: "养得半死不活的。",
   },
   index: 0,
  });

  expect(model.title).toBe("Hoàn thành đoạn hội thoại");
  expect(model.dialogue).toHaveLength(2);
  expect(model.givenWords).toEqual(["半死不活"]);
  expect(model.answer).toContain("半死不活");
 });

 it.each([
  ["fill_blank", { prompt: "我___学生。", answer: "是" }],
  ["answer_with_pattern", { prompt: "你去哪儿？", sample_answer: "我去学校。" }],
  ["multiple_choice", { prompt: "选一个。", choices: [{ id: "A", text: "甲" }], answer: "A" }],
  ["generic_type", { text: "Nội dung generic", answer: "Đáp án generic" }],
 ])("maps %s object questions without an empty placeholder", (exerciseType, value) => {
  const model = buildExerciseQuestionViewModel({ exerciseType, value, index: 0 });

  expect(model.title).not.toBe("Câu hỏi");
  expect(model.answer).toBeTruthy();
 });
});

describe("hasExercisePassagePayload", () => {
 it("does not turn ordinary exercise metadata into a passage", () => {
  expect(
   hasExercisePassagePayload({
    title: "Chọn từ điền chỗ trống",
    instruction: { vi: "Chọn từ thích hợp." },
    word_bank: ["高兴"],
    answer_key: [{ answer: "高兴" }],
   }),
  ).toBe(false);
 });

 it("recognizes actual passage content", () => {
  expect(hasExercisePassagePayload({ passage: { text: "这是课文。" } })).toBe(true);
  expect(hasExercisePassagePayload({ text_with_blanks: "我___学生。" })).toBe(true);
 });
});
