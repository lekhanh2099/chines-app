import { describe, expect, it } from "vitest";

import { userLearningStateSchema } from "./learning-state.schema";

function learningStateWithFont(hanziFont: string) {
 return {
  settings: {
   lessonTextDisplayMode: {
    showPinyin: true,
    showMeaning: false,
    showAnswers: false,
    hanziFont,
    hanziSize: "lg",
    revealMode: "always",
   },
  },
  progress: {},
  bookmarks: {},
  reviewHistory: [],
 };
}

describe("learning-state reader font compatibility", () => {
 it.each(["kai", "mengshen"])("migrates legacy %s to system", (hanziFont) => {
  const parsed = userLearningStateSchema.parse(learningStateWithFont(hanziFont));

  expect(parsed.settings.lessonTextDisplayMode?.hanziFont).toBe("system");
 });

 it.each(["system", "songti", "pinyin"])("preserves supported %s", (hanziFont) => {
  const parsed = userLearningStateSchema.parse(learningStateWithFont(hanziFont));

  expect(parsed.settings.lessonTextDisplayMode?.hanziFont).toBe(hanziFont);
 });
});
