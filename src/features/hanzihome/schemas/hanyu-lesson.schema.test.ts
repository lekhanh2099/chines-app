import { describe, expect, it } from "vitest";

import { ExerciseSchema } from "./hanyu-lesson.schema";

describe("ExerciseSchema", () => {
 it("preserves Vietnamese labels for a choose-words word bank", () => {
  const wordBank = [
   "课外",
   "发",
   "优美",
   "表示",
   "柔和",
   "放心",
   "适应",
   "首",
   "作用",
   "预防",
   "分别",
   "好玩儿",
  ];
  const wordBankVi = [
   "ngoại khóa",
   "gửi",
   "đẹp",
   "bày tỏ",
   "dịu nhẹ",
   "yên tâm",
   "thích nghi",
   "lượng từ",
   "tác dụng",
   "phòng ngừa",
   "lần lượt",
   "vui",
  ];

  const result = ExerciseSchema.parse({
   id: "exercise-1",
   type: "choose_words_fill_blank",
   order: 3,
   title: "选词填空",
   word_bank: wordBank,
   word_bank_vi: wordBankVi,
   questions: [],
  });

  expect(result.word_bank).toEqual(wordBank);
  expect(result.word_bank_vi).toEqual(wordBankVi);
 });
});
