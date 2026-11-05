import { describe, expect, it } from "vitest";
import { extractLessonMandarinTexts } from "./useLessonAudioPack";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

describe("useLessonAudioPack", () => {
 const lesson = getTextbookLesson("nhip-cau", 4);
 if (!lesson) throw new Error("Lesson 4 not found");

 it("extracts unique Mandarin texts from vocab and dictation sentences", () => {
  const texts = extractLessonMandarinTexts(lesson);
  expect(texts.length).toBeGreaterThan(50);
  // Contains vocabulary words
  expect(texts).toContain("醉");
  // Contains sentences from lesson text
  expect(texts.some((t) => t.includes("春夜"))).toBe(true);
 });

 it("handles null or undefined lesson gracefully", () => {
  expect(extractLessonMandarinTexts(null)).toEqual([]);
  expect(extractLessonMandarinTexts(undefined)).toEqual([]);
 });
});
