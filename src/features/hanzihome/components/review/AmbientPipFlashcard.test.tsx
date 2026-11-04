import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmbientPipFlashcard } from "./AmbientPipFlashcard";
import { textbookLessonToReviewLesson } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
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

describe("AmbientPipFlashcard", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const reviewLesson = textbookLessonToReviewLesson(lesson);

 it("renders the hero Hanzi and context sentence prompt", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipFlashcard, {
    items: reviewLesson.vocab,
    lessonTitle: "Nhịp cầu Bài 5",
   }),
  );

  expect(html).toContain("Nhịp cầu Bài 5");
  expect(html).toContain("1/59");
  expect(html).toContain(reviewLesson.vocab[0]?.hanzi);
 });

 it("renders close button and handles in-app floating mode", () => {
  const onClose = vi.fn();
  const html = renderToStaticMarkup(
   createElement(AmbientPipFlashcard, {
    items: reviewLesson.vocab,
    onClose,
    isFloatingInApp: true,
   }),
  );

  expect(html).toContain("fixed bottom-5 right-5");
  expect(html).toContain("Đóng");
 });
});
