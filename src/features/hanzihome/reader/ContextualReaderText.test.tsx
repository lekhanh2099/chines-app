import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import readerDocumentMessages from "../../../../messages/vi/reader-document.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { analyzeContextualPronunciation } from "../pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "./ContextualReaderText";

function renderReaderText(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider locale="vi" messages={{ Reader: { document: readerDocumentMessages } }}>
   {element}
  </NextIntlClientProvider>,
 );
}

describe("ContextualReaderText", () => {
 it("renders Hanzi and contextual spoken pinyin with the HanziHome typography primitive", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
   />,
  );
  expect(markup).toContain("一");
  expect(markup).toContain("yí");
  expect(markup).toContain("gè");
 });

 it("keeps paragraph-mode glyph playback keyboard reachable", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    pinyinPresentation="paragraph"
    onGlyphClick={() => undefined}
   />,
  );
  expect(markup).toContain('role="button"');
  expect(markup).toContain('tabindex="0"');
  expect(markup).toContain('aria-label="Đọc từ chữ 一"');
  expect(markup).toContain('aria-label="Đọc từ chữ 个"');
 });

 it("marks unconfirmed polyphonic pinyin beyond color and announces the review state", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "重庆", sourcePinyin: null })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    onGlyphClick={() => undefined}
    onGlyphInspect={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Đọc từ chữ 重"');
  expect(markup).toContain('aria-label="Pinyin chữ 重 cần kiểm tra"');
  expect(markup).toContain('aria-label="Đọc từ chữ 庆"');
  expect(markup).toContain('aria-label="Kiểm tra pinyin chữ 庆"');
  expect(markup).toContain("text-warning");
  expect(markup).toContain("decoration-dotted");
 });

 it("does not mark source-aligned polyphonic pinyin for review", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "重庆", sourcePinyin: "Chóngqìng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    onGlyphInspect={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Kiểm tra pinyin chữ 重"');
  expect(markup).not.toContain("text-warning");
  expect(markup).not.toContain("decoration-dotted");
 });

 it("preserves reviewed source phrase pinyin when alignment is valid", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "浙江", sourcePinyin: "Zhèjiāng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    pinyinPresentation="paragraph"
    sourcePinyin="Zhèjiāng"
   />,
  );
  expect(markup).toContain("Zhèjiāng");
  expect(markup).not.toContain("zhè jiāng");
 });

 it("renders a manual pinyin override instead of the original aligned source line", () => {
  const analysis = analyzeContextualPronunciation({
   text: "好",
   sourcePinyin: "hǎo",
   overrides: [
    {
     id: "override-1",
     text: "好",
     readings: ["hao4"],
     scope: "sentence-instance",
     sentenceText: "好",
     start: 0,
     end: 1,
     updatedAt: "2026-08-19T00:00:00.000Z",
    },
   ],
  });
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analysis}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    pinyinPresentation="paragraph"
    sourcePinyin="hǎo"
   />,
  );
  expect(markup).toContain("hào");
  expect(markup).not.toContain(">hǎo<");
 });

 it("marks the active glyph while the reader is speaking", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "北京", sourcePinyin: "Běijīng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    activeCharacterIndex={1}
   />,
  );
  expect(markup).toContain("reading-progress-highlight");
  expect(markup).toContain('aria-current="true"');
 });
});
