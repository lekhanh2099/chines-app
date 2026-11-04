import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmbientPipExerciseRunner } from "./AmbientPipExerciseRunner";
import { adaptTextbookPracticeToUniversal } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

vi.mock("@/features/speech/MandarinTtsProvider", () => ({
 useMandarinTtsControls: () => ({
  isSpeaking: false,
  isLoading: false,
  speakingRequestText: null,
  speakSequence: vi.fn(),
  stop: vi.fn(),
 }),
}));

describe("AmbientPipExerciseRunner", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const practiceBlocks = lesson.sections
  .filter((sec) => sec.category === "practice")
  .flatMap((sec) => sec.blocks);
 const practiceItems = adaptTextbookPracticeToUniversal(practiceBlocks);

 it("renders the first exercise question in compact layout", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipExerciseRunner, {
    items: practiceItems,
    lessonTitle: "BÀI 5: Bài tập",
   }),
  );

  expect(html).toContain(`Câu 1/${practiceItems.length}`);
  expect(html).toContain("Kiểm tra");
 });

 it("renders floating in app container when requested", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipExerciseRunner, {
    items: practiceItems,
    isFloatingInApp: true,
   }),
  );

  expect(html).toContain("fixed bottom-5 right-5");
 });
});
