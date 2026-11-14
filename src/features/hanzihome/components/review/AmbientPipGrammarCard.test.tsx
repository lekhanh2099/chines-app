import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmbientPipGrammarCard } from "./AmbientPipGrammarCard";
import { adaptTextbookGrammarToPip } from "./pip-grammar-adapter";
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

describe("AmbientPipGrammarCard", () => {
 const lesson = getTextbookLesson("nhip-cau", 5);
 if (!lesson) throw new Error("Lesson not found");
 const grammarPoints = adaptTextbookGrammarToPip(lesson.sections);

 it("renders the first grammar point with title, explanation, and examples", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipGrammarCard, {
    items: grammarPoints,
    lessonTitle: "BÀI 5: Ngữ pháp",
   }),
  );

  expect(html).toContain("BÀI 5: Ngữ pháp");
  expect(html).toContain("1/8");
  expect(html).toContain("得慌");
  expect(html).toContain("bổ ngữ trình độ");
  expect(html).toContain("Ví dụ 1/5");
 });

 it("renders floating in app container when requested", () => {
  const html = renderToStaticMarkup(
   createElement(AmbientPipGrammarCard, {
    items: grammarPoints,
    isFloatingInApp: true,
   }),
  );

  expect(html).toContain("fixed bottom-5 right-5");
 });
});
