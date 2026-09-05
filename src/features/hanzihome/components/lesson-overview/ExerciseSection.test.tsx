import type { ReactNode } from "react";
import { renderToStaticMarkup as renderMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import {
 ExerciseSchema,
 ReadingItemSchema,
 ReadingSectionSchema,
} from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { MandarinTtsProvider } from "@/features/hanzihome/listening/MandarinTtsProvider";

import { ExerciseCard } from "./ExerciseSection";
import { ExerciseRenderIssues } from "./exercise-section/ExerciseRenderIssues";
import { AdaptiveStudyText } from "./hanzi-typography";
import { ReadingCard } from "./ReadingSection";
import { DEFAULT_LESSON_DISPLAY_MODE } from "./types";
import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import readerDocumentMessages from "../../../../../messages/vi/reader-document.json";
import { loadAppMessages } from "@/i18n/messages";
import type { AppLocale } from "@/i18n/config";
import { SampleRetelling } from "./reading-section/SampleRetelling";
import { PassageCard } from "./PassageCard";

vi.mock("next/navigation", () => ({
 useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/dictionary/hooks/useVocabInspector", () => ({
 useVocabInspector: () => ({ openInspector: vi.fn() }),
}));
vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({
  state: { settings: { lessonTextDisplayMode: DEFAULT_LESSON_DISPLAY_MODE } },
 }),
}));

function renderToStaticMarkup(element: ReactNode) {
 return renderMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{ Reader: { study: readerStudyMessages, document: readerDocumentMessages } }}
  >
   {element}
  </NextIntlClientProvider>,
 );
}

describe("ExerciseCard", () => {
 it.each(["vi", "en", "zh-CN"] satisfies AppLocale[])(
  "renders the shared sample reader with loaded %s messages",
  async (locale) => {
   const messages = await loadAppMessages(locale);
   const html = renderMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <MandarinTtsProvider>
      <SampleRetelling
       value={{ zh: "我喜欢读书。", vi: "Tôi thích đọc sách." }}
       displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true, revealMode: "always" }}
      />
     </MandarinTtsProvider>
    </NextIntlClientProvider>,
   );
   expect(html).toContain(messages.Reader.study.chrome.segment.sampleRetelling);
   expect(html).toContain(messages.Reader.study.chrome.surface.aria);
   expect(html).toContain("Tôi thích đọc sách.");
   expect(html).toContain('data-reader-segment-id="sample-retelling"');
   expect(html).not.toContain("Reader.study.");
  },
 );

 it("renders a titleless article with optional paragraph meanings and puts support after the reader", () => {
  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <PassageCard
     itemId="optional-fields"
     displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning: true, revealMode: "always" }}
     passage={{
      paragraphs: [
       { id: "with-meaning", zh: "我喜欢读书。", vi: "Tôi thích đọc sách." },
       { id: "without-meaning", zh: "他也喜欢。" },
      ],
      supplementary_vocabulary: [{ zh: "读书", vi: "đọc sách" }],
     }}
    />
   </MandarinTtsProvider>,
  );
  expect(html).toContain("Nghe bài");
  expect(html).toContain("Đoạn 1 / 2");
  expect(html).toContain('data-reader-segment-id="with-meaning"');
  expect(html).toContain('data-reader-segment-id="without-meaning"');
  expect(html).toContain("Tôi thích đọc sách.");
  expect(html).not.toContain("<header");
  expect(html).not.toContain("Phần 1");
  expect(html.indexOf("Từ bổ sung")).toBeGreaterThan(
   html.indexOf('data-reader-segment-id="without-meaning"'),
  );
 });

 it("uses the Chinese exercise title instead of page metadata mislabeled as Vietnamese", () => {
  const item = ExerciseSchema.parse({
   id: "boya-preintermediate-2-l01-src-004",
   type: "fill_blank",
   order: 4,
   title: "选择合适的动词填空,并说说句子中“出来”的意思:",
   title_vi: "Trang bài tập 9",
   instruction: {
    zh: "选择合适的动词填空,并说说句子中“出来”的意思:",
    vi: "Trang bài tập 9",
   },
   questions: [],
  });

  const html = renderToStaticMarkup(
   <ExerciseCard item={item} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />,
  );

  expect(html).toContain("选择合适的动词填空");
  expect(html).not.toContain("Trang bài tập 9");
 });

 it("applies the selected Hanzi font and size to questions and answers", () => {
  const item = ExerciseSchema.parse({
   id: "boya-9e-intermediate-1-l01-exercise-07",
   type: "fill_blank",
   order: 7,
   title: "用提示词完成句子",
   title_vi: "Hoàn thành câu",
   instruction: { zh: "", vi: "" },
   questions: [
    {
     id: "question-1",
     prompt: "他在美国待了三年，__________。（居然）",
     answer: "居然一句英语都不会说。",
    },
   ],
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
   hanziFont: "songti",
   hanziSize: "xl",
  } satisfies typeof DEFAULT_LESSON_DISPLAY_MODE;

  const html = renderToStaticMarkup(<ExerciseCard item={item} displayMode={displayMode} />);

  expect(html).toContain("他在美国待了三年");
  expect(html).toContain("居然一句英语都不会说");
  expect(html).toContain("font-size:clamp(1.375rem, 4vw, 1.75rem)");
  expect(html).toContain("Noto Serif SC");
 });

 it("applies the reader font only to Han text in mixed exercise content", () => {
  const html = renderToStaticMarkup(
   <AdaptiveStudyText
    as="div"
    text="Cấu trúc: 主语 + 补语 + 了"
    displayMode={DEFAULT_LESSON_DISPLAY_MODE}
   />,
  );

  expect(html).toMatch(
   /<div[^>]*>Cấu trúc: <span[^>]*lang="zh-CN"[^>]*>主语<\/span> \+ <span[^>]*>补语<\/span> \+ <span[^>]*>了<\/span><\/div>/,
  );
  expect(html).not.toMatch(/<div[^>]*font-family=/);
 });

 it("resolves a suffixed reading reference before rendering a cloze exercise", () => {
  const readingItem = ReadingItemSchema.parse({
   id: "reading-01",
   type: "reading_text",
   order: 1,
   title: "拔苗助长",
   paragraphs: [
    {
     id: "paragraph-01",
     order: 1,
     zh: "①____，反而害了禾苗。",
    },
   ],
   answers: [{ blank_id: "blank-01", answer: "揠苗助长" }],
  });
  const item = ExerciseSchema.parse({
   id: "lesson-09-exercise-09",
   type: "reading_fill_blank",
   variant: "reading_cloze",
   order: 9,
   title: "综合填空",
   reading_ref: "reading_01_bamiaozhuzhang",
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
  } satisfies typeof DEFAULT_LESSON_DISPLAY_MODE;

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard item={item} displayMode={displayMode} readingItems={[readingItem]} />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("揠苗助长");
  expect(html).not.toContain("Không thể render đầy đủ bài tập");
 });

 it("does not repeat a linked reading title already owned by the exercise card", () => {
  const readingItem = ReadingItemSchema.parse({
   id: "reading-01",
   type: "reading_text",
   order: 1,
   title: "综合填空：拔苗助长",
   title_vi: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   paragraphs: [
    { id: "paragraph-01", order: 1, zh: "有个性急的人。" },
    { id: "paragraph-02", order: 2, zh: "他每天给禾苗浇水。" },
   ],
  });
  const item = ExerciseSchema.parse({
   id: "lesson-07-exercise-09",
   type: "reading_fill_blank",
   variant: "reading_cloze",
   order: 9,
   title: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   title_vi: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   reading_ref: "reading_01_bamiaozhuzhang",
   answer_key: [{ answer: "可是", blank_id: "blank-01" }],
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard
     item={item}
     displayMode={DEFAULT_LESSON_DISPLAY_MODE}
     readingItems={[readingItem]}
    />
   </MandarinTtsProvider>,
  );

  expect(html.split("Bài đọc điền từ: Nhổ mầm giúp cây lớn")).toHaveLength(2);
  expect(html).toContain("Nghe bài");
  expect(html).toContain("Công cụ học");
  expect(html).toContain("Đoạn 1 / 2");
  expect(html).toContain('data-reader-segment-id="paragraph-01"');
  expect(html).toContain('data-reader-segment-id="paragraph-02"');
 });

 it("reports a missing cloze marker when a linked reading passage is plain text", () => {
  const readingItem = ReadingItemSchema.parse({
   id: "reading-001",
   type: "reading_text",
   order: 1,
   title: "综合填空：拔苗助长",
   title_vi: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   paragraphs: [{ id: "paragraph-01", order: 1, zh: "可是苗长得不像他想的那么快。" }],
  });
  const item = ExerciseSchema.parse({
   id: "lesson-07-exercise-09",
   type: "reading_fill_blank",
   variant: "reading_cloze",
   order: 9,
   title: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   title_vi: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   reading_ref: "reading_01_bamiaozhuzhang",
   answer_key: [{ answer: "可是", blank_id: "blank-01" }],
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard
     item={item}
     displayMode={DEFAULT_LESSON_DISPLAY_MODE}
     readingItems={[readingItem]}
    />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("passage chưa có marker/chỗ trống để gắn đáp án");
 });

 it("resolves a source reading-section reference and renders its question answer key", () => {
  const readingSection = ReadingSectionSchema.parse({
   id: "reading-runtime-id",
   type: "reading",
   order: 7,
   title: "Đọc hiểu",
   items: [
    {
     id: "reading-01",
     type: "reading_text",
     order: 1,
     title: "课文",
     paragraphs: [{ id: "paragraph-01", order: 1, zh: "王明每天学习汉语。" }],
    },
   ],
  });
  const item = ExerciseSchema.parse({
   id: "lesson-01-exercise-01",
   type: "reading_comprehension",
   order: 1,
   title: "根据课文回答问题",
   linked_section_id: "section_07_reading",
   questions: [{ id: "question-01", prompt: "谁每天学习汉语？" }],
   answer_key: [{ answer: "王明" }],
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
  } satisfies typeof DEFAULT_LESSON_DISPLAY_MODE;

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard
     item={item}
     displayMode={displayMode}
     readingItems={readingSection.items}
     readingSections={[readingSection]}
    />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("王明每天学习汉语");
  expect(html).toContain("王明");
  expect(html).not.toContain("Chưa có nội dung");
 });

 it("resolves a json item reference for reading comprehension", () => {
  const readingItem = ReadingItemSchema.parse({
   id: "reading-01",
   type: "reading_text",
   order: 1,
   title: "课文",
   paragraphs: [{ id: "paragraph-01", order: 1, zh: "王明每天学习汉语。" }],
  });
  const item = ExerciseSchema.parse({
   id: "lesson-10-exercise-08",
   type: "reading_comprehension",
   order: 8,
   title: "阅读理解",
   json_item_id: "reading_01",
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard
     item={item}
     displayMode={DEFAULT_LESSON_DISPLAY_MODE}
     readingItems={[readingItem]}
    />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("王明每天学习汉语");
  expect(html).not.toContain("Chưa có nội dung");
 });

 it("uses cloze answers nested in a direct passage before reporting an incomplete render", () => {
  const item = ExerciseSchema.parse({
   id: "lesson-03-exercise-01",
   type: "reading_fill_blank",
   order: 1,
   title: "北京的四季",
   passage: {
    id: "passage-01",
    text_with_blanks: "她①____了。",
    answers: [{ blank_id: "blank-01", answer: "来了" }],
   },
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
  } satisfies typeof DEFAULT_LESSON_DISPLAY_MODE;

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard item={item} displayMode={displayMode} />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("来了");
  expect(html).not.toContain("Không thể render đầy đủ bài tập");
 });

 it("renders ordered question answers in a direct reading cloze passage", () => {
  const item = ExerciseSchema.parse({
   id: "hanyu-3-2-lesson-19-exercise-009",
   type: "reading_cloze",
   variant: "comprehensive_cloze",
   order: 9,
   title: "综合填空",
   passage: {
    id: "reading-001-passage",
    text_with_blanks:
     "小丽①______个可爱的小女孩儿。出院后，②______她显得更瘦小了。③______于她来说，这是一件痛苦的事。④______下星期一开始，所有同学都要戴⑤______自己最喜欢的帽子来学校。每一个同学都戴⑥______帽子。她觉得自己⑦______别人没有什么不一样。现在，⑧______渐渐忘了自己还戴着一顶帽子。",
   },
   questions: [
    { id: "question-01", order: 1, answer: "是" },
    { id: "question-02", order: 2, answer: "现在" },
    { id: "question-03", order: 3, answer: "对" },
    { id: "question-04", order: 4, answer: "从" },
    { id: "question-05", order: 5, answer: "上" },
    { id: "question-06", order: 6, answer: "着" },
    { id: "question-07", order: 7, answer: "跟" },
    { id: "question-08", order: 8, answer: "小丽" },
   ],
  });
  const displayMode = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   showAnswers: true,
  } satisfies typeof DEFAULT_LESSON_DISPLAY_MODE;

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ExerciseCard item={item} displayMode={displayMode} />
   </MandarinTtsProvider>,
  );

  expect(html).toContain("是");
  expect(html).toContain("现在");
  expect(html).toContain("对");
  expect(html).toContain("从");
  expect(html).toContain("上");
  expect(html).toContain("着");
  expect(html).toContain("跟");
  expect(html).toContain("小丽");
  expect(html).not.toContain("Không thể render đầy đủ bài tập");
 });

 it("does not report a missing passage for structured reading groups", () => {
  const item = ExerciseSchema.parse({
   id: "lesson-16-exercise-01",
   type: "reading_fill_blank",
   order: 1,
   title: "金星人遇到麻烦",
   parts: [{ id: "part-01", title: "Phần 1", questions: [] }],
  });

  const html = renderToStaticMarkup(
   <ExerciseRenderIssues
    item={item}
    passage={null}
    answers={[{ blank_id: "blank-01", answer: "去" }]}
    hasStructuredQuestionGroups
   />,
  );

  expect(html).toBe("");
 });
});

describe("ReadingCard", () => {
 it("renders the reading passage with shared reader controls and source-aligned ruby pinyin", () => {
  const item = ReadingItemSchema.parse({
   id: "reading-kezhouqiujian",
   type: "reading_text",
   order: 1,
   title: "刻舟求剑",
   title_vi: "Khắc thuyền tìm kiếm",
   paragraphs: [
    {
     id: "paragraph-01",
     order: 1,
     zh: "从前，有一个人坐船过河。",
     pinyin: "cóng qián，yǒu yí ge rén zuò chuán guò hé。",
     vi: "Ngày xưa, có một người ngồi thuyền qua sông.",
    },
    {
     id: "paragraph-02",
     order: 2,
     zh: "船在河里走了好久，终于到了岸边。",
     pinyin: "chuán zài hé lǐ zǒu le hǎo jiǔ，zhōng yú dào le àn biān。",
    },
    {
     id: "paragraph-03",
     order: 3,
     zh: "这也是中国一个很有名的成语故事。",
     pinyin: "zhè yě shì zhōng guó yí ge hěn yǒu míng de chéng yǔ gù shi。",
    },
   ],
  });
  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ReadingCard
     item={item}
     displayMode={{ ...DEFAULT_LESSON_DISPLAY_MODE, autoDetectPinyin: true, showMeaning: true }}
    />
   </MandarinTtsProvider>,
  );
  expect(html).toContain("Đoạn 1 / 3");
  expect(html).toContain("Nghe bài");
  expect(html).toContain("Công cụ học");
  expect(html).toContain("Tốc độ đọc");
  expect(html).toContain("Mục lục đoạn");
  expect(html).toContain("<ruby");
  expect(html).toContain('aria-label="Pinyin chữ 个 cần kiểm tra"');
  expect(html).toContain("text-warning");
  expect(html).toContain(">ge</span>");
  expect(html).toContain("Ngày xưa, có một người ngồi thuyền qua sông.");
 });

 it("keeps cloze answers concealed until explicitly revealed", () => {
  const item = ReadingItemSchema.parse({
   id: "reading-cloze",
   type: "reading_cloze",
   order: 1,
   title: "填空",
   passage: {
    text_with_blanks: "她①____了。",
    answers: [{ blank_id: "blank-01", answer: "回家" }],
   },
  });
  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ReadingCard item={item} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />
   </MandarinTtsProvider>,
  );
  expect(html).not.toContain(">回家<");
  expect(html).not.toContain("data-reader-segment-id");
 });

 it("does not repeat its own reading title inside the linked passage card", () => {
  const item = ReadingItemSchema.parse({
   id: "reading-001",
   type: "reading_text",
   order: 1,
   title: "综合填空：拔苗助长",
   title_vi: "Bài đọc điền từ: Nhổ mầm giúp cây lớn",
   paragraphs: [{ id: "paragraph-01", order: 1, zh: "有个性急的人。" }],
   answer_key: [{ answer: "可是", blank_id: "blank-01" }],
  });

  const html = renderToStaticMarkup(
   <MandarinTtsProvider>
    <ReadingCard item={item} displayMode={DEFAULT_LESSON_DISPLAY_MODE} />
   </MandarinTtsProvider>,
  );

  expect(html.split("Bài đọc điền từ: Nhổ mầm giúp cây lớn")).toHaveLength(2);
 });
});
