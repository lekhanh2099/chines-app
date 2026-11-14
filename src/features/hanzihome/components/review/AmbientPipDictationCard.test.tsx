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
  expect(html).not.toContain('aria-label="Nghe lại');
  expect(html).toContain("Kiểm tra (↵)");
 });

 it("renders rate cycle and shuffle toolbar actions", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipDictationCard, {
    items: reviewLesson.vocab,
    lessonTitle: "Nhịp cầu Bài 5",
   }),
  );

  expect(html).toContain("1x");
  expect(html).toContain("Tốc độ đọc");
  expect(html).toContain("Xáo trộn từ vựng (Shuffle)");
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

 it("renders Vietnamese-to-Chinese dictation mode with Vietnamese audio prompt and helper", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipDictationCard, {
    items: reviewLesson.vocab,
    lessonTitle: "Nhịp cầu Bài 5",
    initialMode: "vi-to-zh",
   }),
  );

  expect(html).toContain("Việt ➔ Hán");
  expect(html).toContain("Nghe tiếng Việt (Ctrl+R)");
  expect(html).toContain("Nghe nghĩa tiếng Việt, gõ chữ Hán...");
  expect(html).toContain("🇨🇳 Trung");
 });
});
