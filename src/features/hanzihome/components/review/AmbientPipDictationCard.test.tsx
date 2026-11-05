import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmbientPipDictationCard } from "./AmbientPipDictationCard";
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

describe("AmbientPipDictationCard", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const reviewLesson = textbookLessonToReviewLesson(lesson);

 it("renders the dictation input prompt, word counter, and audio replay button", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipDictationCard, {
    items: reviewLesson.vocab,
    lessonTitle: "Nhịp cầu Bài 5",
   }),
  );

  expect(html).toContain("Nhịp cầu Bài 5");
  expect(html).toContain(`1/${reviewLesson.vocab.length}`);
  expect(html).toContain("Gõ chữ Hán rồi bấm Enter...");
  expect(html).toContain("Nghe lại (Ctrl+R)");
  expect(html).toContain("Kiểm tra (↵)");
 });

 it("renders in-app floating mode with close button", () => {
  const onClose = vi.fn();
  const html = renderToStaticMarkup(
   createElement(AmbientPipDictationCard, {
    items: reviewLesson.vocab,
    onClose,
    isFloatingInApp: true,
   }),
  );

  expect(html).toContain("fixed bottom-5 right-5");
  expect(html).toContain("Đóng");
 });
});
