import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import readerDocumentMessages from "../../../../messages/vi/reader-document.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { LessonTranslationWorkspace } from "./LessonTranslationWorkspace";
import type { TranslationSegment } from "./translation-practice";

vi.mock("@/features/hanzihome/listening/MandarinSpeakButton", () => ({
 MandarinSpeakButton: ({ text }: { text: string }) => (
  <button type="button" aria-label={`Đọc: ${text}`}>
   Phát âm
  </button>
 ),
}));

vi.mock("./practice-attempt-api", () => ({
 savePracticeAttempt: vi.fn().mockResolvedValue({ id: "attempt-1" }),
}));

function renderWorkspace(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   timeZone="Asia/Ho_Chi_Minh"
   messages={{ Reader: { document: readerDocumentMessages } }}
  >
   {element}
  </NextIntlClientProvider>,
 );
}

const mockSegments: readonly TranslationSegment[] = [
 {
  id: "segment-1",
  order: 1,
  sourceLabel: "Bài 1 · Đoạn 1",
  zh: "你好，很高兴认识你。",
  pinyin: "",
  vi: "Xin chào, rất vui được làm quen với bạn.",
 },
];

describe("LessonTranslationWorkspace", () => {
 it("renders Chinese source text with ruby pinyin, toggle button, and MandarinSpeakButton", () => {
  const markup = renderWorkspace(
   <LessonTranslationWorkspace
    segments={mockSegments}
    displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin: true, autoDetectPinyin: true }}
   />,
  );

  expect(markup).toContain("Luyện dịch hai chiều");
  expect(markup).toContain("你好");
  expect(markup).toContain("<ruby");
  expect(markup).toContain("<rt");
  expect(markup).toContain("nǐ");
  expect(markup).toContain("hǎo");
  expect(markup).toContain('aria-label="Ẩn pinyin"');
  expect(markup).toContain('aria-label="Đọc: 你好，很高兴认识你。"');
 });

 it("renders empty state card when segments are empty", () => {
  const markup = renderWorkspace(<LessonTranslationWorkspace segments={[]} />);

  expect(markup).toContain("Bài này chưa có đoạn dịch song ngữ để luyện tập.");
 });
});
