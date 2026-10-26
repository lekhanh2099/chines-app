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
 it("keeps each source paragraph in its own card and marks only the current segment", async () => {
  const messages = await loadAppMessages("vi");
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={[
      { id: "first", zh: "你好。", vi: "Xin chào." },
      { id: "second", zh: "再见。", vi: "Tạm biệt." },
     ]}
     services={{
      speech: {
       speak: async () => ({ completed: true, cancelled: false }),
       stop: () => {},
      },
     }}
    />
   </NextIntlClientProvider>,
  );
  const articles = html.match(/<article\b[\s\S]*?<\/article>/g) ?? [];
  const firstArticle = articles[0];
  const secondArticle = articles[1];
  if (!firstArticle || !secondArticle) throw new Error("Expected both source paragraph cards.");

  expect(articles).toHaveLength(2);
  expect(firstArticle).toContain('data-reader-segment="first"');
  expect(firstArticle).toContain('data-active="true"');
  expect(firstArticle).toContain('aria-current="true"');
  expect(firstArticle.slice(0, firstArticle.indexOf(">"))).toContain("bg-surface-muted");
  expect(firstArticle).toContain("Xin chào.");
  expect(firstArticle).not.toContain("Tạm biệt.");
  const firstText = Array.from(firstArticle.matchAll(/>([^<>]*)</g), (match) => match[1]).join("");
  expect(firstText).toContain("你好。");
  expect(secondArticle).toContain('data-reader-segment="second"');
  expect(secondArticle).toContain('data-active="false"');
  expect(secondArticle).not.toContain('aria-current="true"');
  expect(secondArticle.slice(0, secondArticle.indexOf(">"))).toContain("bg-surface");
  expect(secondArticle.slice(0, secondArticle.indexOf(">"))).not.toContain("bg-surface-muted");
  expect(secondArticle).toContain("Tạm biệt.");
  expect(secondArticle).not.toContain("Xin chào.");
  const secondText = Array.from(secondArticle.matchAll(/>([^<>]*)</g), (match) => match[1]).join(
   "",
  );
  expect(secondText).toContain("再见。");
  for (const article of articles) {
   expect(article.match(/data-slot="card"/g)).toHaveLength(1);
   expect(
    article.split(`aria-label="${messages.Reader.study.chrome.commands.listen}"`),
   ).toHaveLength(2);
  }
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

 it.each([
  {
   id: "nhip-cau-lesson-04-source-9",
   text: '身后传来一串自行车铃声，陈静"哎"了一声，骑车的小伙子已经一掠而过。',
   sourcePinyin: "",
   readings: [
    { character: "了", pinyin: "le" },
    { character: "掠", pinyin: "lüè" },
   ],
  },
  {
   id: "nhip-cau-lesson-04-source-5",
   text:
    '"再遇到人，一定开口。"陈静想着，抬眼望了望胡同里昏黄的路灯。夜深了，到处是一片片黑黝黝的怪影。"唉！这倒霉的自行车！"她推着车子，无可奈何地说。',
   sourcePinyin: "",
   readings: [{ character: "地", pinyin: "de" }],
  },
  {
   id: "unsupported-hanzi",
   text: "你𰻞好",
   sourcePinyin: "",
   readings: [
    { character: "你", pinyin: "nǐ" },
    { character: "好", pinyin: "hǎo" },
   ],
  },
  {
   id: "syllabic-nasal-source",
   text: "嗯呣",
   sourcePinyin: "ńg m̀",
   readings: [
    { character: "嗯", pinyin: "ńg" },
    { character: "呣", pinyin: "m̀" },
   ],
  },
 ])(
  "renders corrected contextual pinyin in the reviewed passage $id",
  async ({ id, text, sourcePinyin, readings }) => {
   const messages = await loadAppMessages("vi");
   const analysis = analyzeContextualPronunciation({ text, sourcePinyin: sourcePinyin || null });
   const html = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages}>
     <Reader
      data={[{ id, zh: text, pinyin: sourcePinyin }]}
      services={{
       pronunciationReview: {
        analyses: new Map([[id, analysis]]),
        readingUnitsBySegmentId: new Map([[id, getContextualReadingUnits(analysis)]]),
        onInspect: () => undefined,
       },
      }}
     />
    </NextIntlClientProvider>,
   );

   expect(html).toContain(`<article data-reader-segment="${id}"`);
   expect(html).toContain("<ruby");
   expect(html).not.toContain("lvè");
   for (const { character, pinyin } of readings) {
    const glyph = analysis.glyphs.find((item) => item.text === character);
    if (glyph === undefined) throw new Error(`Expected a pronunciation glyph for ${character}.`);
    const label = (
     glyph.isPolyphonic
      ? messages.Reader.document.text.inspectUnconfirmedPinyin
      : messages.Reader.document.text.inspectPinyin
    ).replace("{character}", character);
    expect(html).toContain(`aria-label="${label}">${pinyin}</span>`);
   }
   for (const glyph of analysis.unresolved) {
    expect(html).toContain(`>${glyph.text}</span>`);
    expect(html).not.toContain(
     `aria-label="${messages.Reader.document.text.inspectPinyin.replace("{character}", glyph.text)}"`,
    );
   }
   for (const punctuation of ['"', "，", "。", "！"]) {
    const escapedPunctuation = punctuation === '"' ? "&quot;" : punctuation;
    expect(html.match(new RegExp(`>${escapedPunctuation}</span>`, "gu")) ?? []).toHaveLength(
     text.split(punctuation).length - 1,
    );
   }
  },
 );

 it("keeps every grouped ruby unit intact when a long passage wraps", async () => {
  const messages = await loadAppMessages("vi");
  const analysis = analyzeContextualPronunciation({
   text: "一位北京的大学生收到了井冈山少年的一封信，由此引出下面一个感人的故事。",
  });
  const rubyUnitCount = getContextualReadingUnits(analysis).filter(
   (unit) => unit.type === "hanzi",
  ).length;
  const html = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages}>
    <Reader
     data={[{ id: "wrapped", zh: analysis.normalizedText }]}
     services={{
      pronunciationReview: {
       analyses: new Map([["wrapped", analysis]]),
       readingUnitsBySegmentId: new Map([["wrapped", getContextualReadingUnits(analysis)]]),
       onInspect: () => undefined,
      },
     }}
    />
   </NextIntlClientProvider>,
  );

  expect(html.match(/<ruby class="whitespace-nowrap"/g)).toHaveLength(rubyUnitCount);
  expect(html).toContain("leading-[1.7]");
 });
});
