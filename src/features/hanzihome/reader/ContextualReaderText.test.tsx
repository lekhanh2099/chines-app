import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import readerDocumentMessages from "../../../../messages/vi/reader-document.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { analyzeContextualPronunciation } from "../pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "./ContextualReaderText";
import * as annotationProvider from "../annotations/LessonAnnotationProvider";
import type { ResolvedLessonTextAnnotation } from "../annotations/types";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import type { ReaderAnnotationRow } from "./reader.schemas";
import { ProgressiveStudyText } from "../components/lesson-overview/ProgressiveStudyText";

afterEach(() => vi.restoreAllMocks());

function renderReaderText(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider locale="vi" messages={{ Reader: { document: readerDocumentMessages } }}>
   {element}
  </NextIntlClientProvider>,
 );
}

describe("ContextualReaderText", () => {
 const readerAnnotation: ReaderAnnotationRow = {
  id: "9a49c6f1-6c9e-4c34-b5f9-e6ecaa0a1c85",
  user_id: "e1262d39-c0e1-49b4-8194-3f184b2b182e",
  document_id: "textbook-1:text",
  paragraph_id: "paragraph-1",
  asset_id: null,
  annotation_type: "note",
  page_number: null,
  start_offset: 2,
  end_offset: 4,
  selected_text: "乐器",
  note_text: "Nhạc cụ",
  color: "yellow",
  payload: {},
  revision: 0,
  created_at: "2026-09-06T00:00:00.000Z",
  updated_at: "2026-09-06T00:00:00.000Z",
  deleted_at: null,
 };
 it.each([true, false])(
  "renders persisted Reader annotations with pinyin=%s without a lesson provider",
  (showPinyin) => {
   const markup = renderReaderText(
    <ContextualReaderText
     analysis={analyzeContextualPronunciation({ text: "一种乐器。" })}
     displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin }}
     readerAnnotations={[readerAnnotation]}
     onOpenReaderAnnotation={() => undefined}
    />,
   );
   expect(markup.match(/reading-highlight/g)).toHaveLength(2);
   expect(markup).toContain('aria-label="Mở ghi chú cho 乐器"');
   expect(markup).not.toContain("data-lesson-id=");
  },
 );
 it("does not highlight an annotation whose saved text no longer matches the source", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一种乐器。" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    readerAnnotations={[{ ...readerAnnotation, selected_text: "音乐" }]}
   />,
  );
  expect(markup).not.toContain("reading-highlight");
 });
 it.each([true, false])("preserves Reader notes in the fallback renderer with tap=%s", (tap) => {
  const markup = renderReaderText(
   <ProgressiveStudyText
    zh="一种乐器。"
    displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, revealMode: tap ? "tap" : "always" }}
    readerAnnotations={[readerAnnotation]}
    onOpenReaderAnnotation={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Mở ghi chú cho 乐器"');
  expect(markup).toContain('<mark class="reading-highlight rounded-sm">乐器</mark>');
  expect(markup).toContain('data-reader-hanzi-content="true"');
 });
 const annotation: ResolvedLessonTextAnnotation = {
  id: "note-1",
  lessonId: "lesson-7",
  nodeType: "text_paragraph",
  nodeId: "paragraph-1",
  startOffset: 2,
  endOffset: 4,
  selectedText: "乐器",
  prefixText: "一种",
  suffixText: "。",
  tone: "focus",
  noteId: "saved-note-1",
  noteText: "Nhạc cụ",
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  resolvedStartOffset: 2,
  resolvedEndOffset: 4,
  stale: false,
 };
 const locales = ["vi", "en", "zh-CN"] satisfies AppLocale[];

 it.each(locales)(
  "%s restores saved lesson annotations in ruby and Hanzi-only modes",
  async (locale) => {
   const getAnnotations = vi.fn(() => [annotation]);
   vi.spyOn(annotationProvider, "useLessonAnnotationContext").mockReturnValue({
    getAnnotations,
    openAnnotation: vi.fn(),
    closeAnnotation: vi.fn(),
   });
   const messages = await loadAppMessages(locale);
   for (const showPinyin of [true, false]) {
    const markup = renderToStaticMarkup(
     <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <ContextualReaderText
       analysis={analyzeContextualPronunciation({ text: "一种乐器。" })}
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showPinyin }}
       annotationTarget={{
        lessonId: "lesson-7",
        nodeType: "text_paragraph",
        nodeId: "paragraph-1",
       }}
      />
     </NextIntlClientProvider>,
    );
    expect(markup).toContain('data-study-annotation-node="true"');
    expect(markup).toContain('data-node-id="paragraph-1"');
    expect(markup).toContain('data-node-type="text_paragraph"');
    expect(markup.match(/reading-highlight/g)).toHaveLength(2);
    expect(markup).toContain(
     messages.Reader.document.text.openAnnotation.replace("{text}", "乐器"),
    );
    expect(markup).not.toContain("Reader.document.text.openAnnotation");
    expect(getAnnotations).toHaveBeenCalledWith(
     { lessonId: "lesson-7", nodeType: "text_paragraph", nodeId: "paragraph-1" },
     "一种乐器。",
    );
   }
  },
 );

 it("renders Hanzi and contextual spoken pinyin with the HanziHome typography primitive", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "一个", sourcePinyin: "yī gè" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
   />,
  );
  expect(markup).toContain("一");
  expect(markup).toContain("yī");
  expect(markup).toContain("gè");
  expect(markup).toContain('<rt class="select-none');
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

 it("keeps source-aligned polyphonic pinyin marked until manually reviewed", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "重庆", sourcePinyin: "Chóngqìng" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    onGlyphInspect={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Pinyin chữ 重 cần kiểm tra"');
  expect(markup).toContain("text-warning");
  expect(markup).toContain("decoration-dotted");
 });

 it("keeps dictionary-based polyphonic readings marked for review", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "听得入迷" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    onGlyphInspect={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Pinyin chữ 得 cần kiểm tra"');
  expect(markup).toContain(">de</span>");
  expect(markup).toContain("text-warning");
 });

 it("removes the review marker only after manual confirmation", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({
     text: "得",
     sourcePinyin: "de",
     overrides: [
      {
       id: "reviewed-de",
       text: "得",
       readings: ["de5"],
       scope: "sentence-instance",
       sentenceText: "得",
       start: 0,
       end: 1,
       updatedAt: "2026-09-05T00:00:00.000Z",
      },
     ],
    })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    onGlyphInspect={() => undefined}
   />,
  );
  expect(markup).toContain('aria-label="Kiểm tra pinyin chữ 得"');
  expect(markup).not.toContain("text-warning");
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

 it("keeps rejected source pinyin visible instead of silently replacing it", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "中国", sourcePinyin: "hǎo" })}
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
    sourcePinyin="hǎo"
   />,
  );

  expect(markup).toContain("hǎo");
  expect(markup).not.toContain("zhōng");
  expect(markup).not.toContain("<ruby");
 });

 it("uses contextual ruby pinyin only when auto detection is enabled", () => {
  const markup = renderReaderText(
   <ContextualReaderText
    analysis={analyzeContextualPronunciation({ text: "中国" })}
    displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, autoDetectPinyin: true }}
    sourcePinyin="hǎo"
    onGlyphInspect={() => undefined}
   />,
  );

  expect(markup).toContain("zhōng");
  expect(markup).toContain("guó");
  expect(markup).not.toContain(">hǎo<");
  expect(markup).toContain("<ruby");
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
