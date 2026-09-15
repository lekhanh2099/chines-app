import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import {
 analyzeContextualPronunciation,
 getContextualReadingUnits,
} from "@/lib/pronunciation/contextual-pronunciation";
import { Reader } from "./Reader";
import { defaultReaderDisplay } from "../model/reader-display";
import { useReaderSelector } from "../runtime/reader-context";
import type { ReactNode } from "react";

const locales = ["vi", "en", "zh-CN"] satisfies readonly AppLocale[];

function IntegratedWorkspace({ children }: { children: ReactNode }) {
 const activeId = useReaderSelector((state) => state.navigation.activeSegmentId);
 return <div data-workspace-active={activeId}>{children}</div>;
}

describe("standalone Reader facade", () => {
 it("composes workspace and edit wrappers inside the facade runtime using source IDs", async () => {
  const messages = await loadAppMessages("vi");
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={{
      id: "editable",
      language: "zh-CN",
      source: { kind: "article", sourceId: "source" },
      sections: [{ id: "section", title: "对话", segmentIds: ["line"] }],
      segments: [{ id: "line", sectionId: "section", kind: "paragraph", zh: "你好。" }],
      metadata: [],
      capabilities: [],
     }}
     services={{
      renderReader: ({ content }) => <IntegratedWorkspace>{content}</IntegratedWorkspace>,
      renderSection: ({ section, content }) => <div data-edit-section={section.id}>{content}</div>,
      renderSegment: ({ segment, content }) => <div data-edit-segment={segment.id}>{content}</div>,
     }}
    />
   </NextIntlClientProvider>,
  );
  expect(html).toContain('data-workspace-active="line"');
  expect(html).toContain('data-edit-section="section"');
  expect(html).toContain('data-edit-segment="line"');
  expect(html.match(/data-reader-segment="line"/g)).toHaveLength(1);
  expect(html).toContain("你好。");
 });
 it("preserves structured sections, dialogue speakers, title variants and source IDs", async () => {
  const messages = await loadAppMessages("vi");
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={{
      id: "article",
      language: "zh-CN",
      source: { kind: "article", sourceId: "durable-article" },
      title: "朋友",
      titlePinyin: "péng you",
      titleVi: "Bạn bè",
      sections: [{ id: "conversation", title: "Đối thoại", segmentIds: ["speaker-turn", "quote"] }],
      segments: [
       {
        id: "speaker-turn",
        sectionId: "conversation",
        kind: "dialogue-turn",
        zh: "你好。",
        speaker: { id: "a", label: "小明" },
       },
       { id: "quote", sectionId: "conversation", kind: "quote", zh: "学而时习之。" },
      ],
      metadata: [{ id: "author", label: "Tác giả", value: "小明" }],
      capabilities: [],
     }}
    />
   </NextIntlClientProvider>,
  );
  expect(html).toContain("péng you");
  expect(html).toContain("Bạn bè");
  expect(html).toContain("Đối thoại");
  expect(html).toContain("小明");
  expect(html).toContain('data-reader-segment="speaker-turn"');
  expect(html).toContain('data-reader-segment="quote"');
 });
 it.each(locales)(
  "renders source content and translated controls in %s without product providers",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   const html = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages}>
     <Reader
      data={[{ id: "source", hanzi: "你好。", pinyin: "nǐ hǎo", translation: "Xin chào." }]}
     />
    </NextIntlClientProvider>,
   );
   expect(html).toContain("你好。");
   expect(html).toContain("nǐ hǎo");
   expect(html).toContain("Xin chào.");
   expect(html).toContain(messages.Reader.study.chrome.outline.aria);
   expect(html).toContain(messages.Reader.study.chrome.tools.showPinyin);
   expect(html).toContain(messages.Reader.study.chrome.tools.showTranslation);
   expect(html).not.toContain(messages.Reader.study.chrome.tools.playAll);
   expect(html).toContain("overflow-x-auto");
   expect(html).not.toContain("Reader.study.");
   expect(html).toContain('data-reader-segment="source"');
  },
 );

 it.each(locales)("renders an explicit empty state in %s", async (locale) => {
  const messages = await loadAppMessages(locale);
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale={locale} messages={messages}>
    <Reader data="" />
   </NextIntlClientProvider>,
  );
  expect(html).toContain(messages.Reader.study.chrome.surface.empty);
  expect(html).not.toContain("data-reader-segment=");
 });

 it("does not leak content or display between two instances sharing source IDs", async () => {
  const messages = await loadAppMessages("vi");
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={[{ id: "same", zh: "你好。", pinyin: "nǐ hǎo", vi: "Hidden meaning" }]}
     display={{
      value: { ...defaultReaderDisplay, showPinyin: false, showMeaning: false },
      onChange: () => {},
     }}
    />
    <Reader data={[{ id: "same", zh: "再见。", pinyin: "zài jiàn", vi: "Visible meaning" }]} />
   </NextIntlClientProvider>,
  );
  expect(html).not.toContain("nǐ hǎo");
  expect(html).not.toContain("Hidden meaning");
  expect(html).toContain("zài jiàn");
  expect(html).toContain("Visible meaning");
  expect(html.match(/data-reader-segment="same"/g)).toHaveLength(2);
 });

 it("renders grouped ruby through the Reader runtime while glyph controls stay addressable", async () => {
  const messages = await loadAppMessages("vi");
  const analysis = analyzeContextualPronunciation({ text: "他不太伤心。" });
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={[{ id: "grouped", zh: "他不太伤心。" }]}
     services={{
      pronunciationReview: {
       analyses: new Map([["grouped", analysis]]),
       readingUnitsBySegmentId: new Map([["grouped", getContextualReadingUnits(analysis)]]),
       onInspect: () => undefined,
      },
     }}
    />
   </NextIntlClientProvider>,
  );

  expect(html.match(/<ruby/g)).toHaveLength(4);
  expect(html).toContain("shāng");
  expect(html).toContain("xīn");
  expect(html).toContain('aria-label="Kiểm tra pinyin chữ 伤"');
  expect(html).toContain('aria-label="Kiểm tra pinyin chữ 心"');
 });
});
