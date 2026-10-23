import type { ReaderDisplayAdapter } from "@/features/reader/model/reader-display";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import businessChineseMessages from "../../../../../messages/vi/business-chinese.json";
import ttsStudioMessages from "../../../../../messages/vi/tts-studio.json";
import readerDocumentMessages from "../../../../../messages/vi/reader-document.json";
import readerStudyMessages from "../../../../../messages/vi/reader-study.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import type { UserLearningState, LessonTextDisplaySettings } from "@/features/hanzihome/types";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import {
 getBusinessChineseCatalog,
 getBusinessChineseLesson,
 getTextbookCatalog,
 getTextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

const routerPushMock = vi.hoisted(() => vi.fn());
const readerDocumentMock = vi.hoisted(() => vi.fn<(document: ReaderDocumentModel) => void>());

const readerDisplayMock = vi.hoisted(() =>
 vi.fn<(display: ReaderDisplayAdapter["value"]) => void>(),
);
let mockParams = new URLSearchParams();
let mockPathname = "";
let mockSettings: UserLearningState["settings"] = {};
afterEach(() => {
 mockParams = new URLSearchParams();
 mockPathname = "";
 mockSettings = {};
 mockIsLoading = false;
});

vi.mock("@/components/providers/QueryProvider", () => ({
 useClientSession: () => ({ userId: null, isResolved: true }),
}));

vi.mock("@/features/reader/components/Reader", async (importOriginal) => {
 const actual = await importOriginal<typeof import("@/features/reader/components/Reader")>();
 return {
  ...actual,
  Reader: (props: ComponentProps<typeof actual.Reader>) => {
   if (props.display) readerDisplayMock(props.display.value);
   if (
    typeof props.data === "object" &&
    "segments" in props.data &&
    !props.data.id.endsWith(":all")
   )
    readerDocumentMock(props.data);
   return <actual.Reader {...props} />;
  },
 };
});

vi.mock("@/features/dictionary/hooks/useVocabInspector", () => ({
 useVocabInspector: () => ({ openInspector: vi.fn() }),
}));
const toggleBookmarkMock = vi.fn();
let mockBookmarkedLessonIds: string[] = [];
let mockIsLoading = false;

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => ({
  isLoading: mockIsLoading,
  state: {
   settings: { lessonTextDisplayMode: DEFAULT_LESSON_DISPLAY_MODE, ...mockSettings },
   bookmarks: { lessons: mockBookmarkedLessonIds },
  },
  toggleBookmark: toggleBookmarkMock,
 }),
}));

vi.mock("next/navigation", () => ({
 useSearchParams: () => mockParams,
}));

vi.mock("@/i18n/navigation", () => ({
 useRouter: () => ({ push: routerPushMock }),
 usePathname: () => mockPathname,
}));

vi.mock("@/features/hanzihome/annotations/LessonAnnotationProvider", () => ({
 useLessonAnnotationContext: () => null,
}));

import { BusinessChineseStudyWorkspace } from "./BusinessChineseStudyWorkspace";

function renderWorkspace(element: ReactNode) {
 return renderToStaticMarkup(
  <NextIntlClientProvider
   locale="vi"
   messages={{
    BusinessChinese: businessChineseMessages,
    TtsStudio: ttsStudioMessages,
    Reader: {
     document: readerDocumentMessages,
     study: readerStudyMessages,
    },
   }}
   timeZone="Asia/Ho_Chi_Minh"
  >
   <QueryClientProvider client={new QueryClient()}>{element}</QueryClientProvider>
  </NextIntlClientProvider>,
 );
}

describe("BusinessChineseStudyWorkspace", () => {
 it("resolves the routed book when a mounted textbook workspace receives a new pathname", () => {
  const previousLesson = getTextbookLesson("khau-ngu", 3);
  const currentLesson = getTextbookLesson("doc-hieu", 1);
  const practice = currentLesson?.sections.find((section) => section.category === "practice");
  if (!previousLesson || !currentLesson || !practice)
   throw new Error("Expected the two textbook lessons and reading practice.");
  mockPathname = "/hsk/doc-hieu";
  mockParams = new URLSearchParams("lesson=1&tab=practice");

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={previousLesson} />,
  );

  expect(markup).toContain(currentLesson.title);
  expect(markup).not.toContain(previousLesson.title);
  expect(markup).toContain(`id="${practice.id}"`);
 });

 it("renders each grammar point with its own heading, navigation target and original audio", () => {
  const lesson = getTextbookLesson("nhip-cau", 3);
  const section = lesson?.sections.find((item) => item.category === "grammar");
  if (!lesson || !section) throw new Error("Expected Nhịp cầu lesson 3 grammar.");
  mockParams = new URLSearchParams("lesson=3&tab=grammar");

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={lesson} />,
  );

  expect(markup.match(/<h2\b|role="heading" aria-level="2"/g)).toHaveLength(8);
  expect(markup).not.toMatch(/<h2\b[^>]*>\s*<div/);
  expect(markup).toContain(`id="${section.id}"`);
  expect(markup).not.toContain(`id="${section.id}:title"`);
  for (const heading of section.blocks.filter((item) => item.type === "subheading")) {
   expect(markup.split(` id="${heading.id}"`)).toHaveLength(2);
   if (heading !== section.blocks[0]) {
    expect(markup).toContain(`id="${section.id}:${heading.id}"`);
   }
  }
  expect(markup).toContain('aria-label="Đọc tiếng Trung: 他从来不浪费粮食"');
  expect(markup.replace(/<[^>]*>/g, "")).toContain("Anh ấy chưa bao giờ lãng phí lương thực.");
  expect(markup).toContain("2xl:grid-cols-2");
  expect(markup).not.toContain("max-w-4xl");
 });

 it.each([true, false])("applies grammar reader size and pinyin visibility (%s)", (showPinyin) => {
  const books = getTextbookCatalog();
  const book = books.find((item) => item.key === "nhip-cau");
  const lesson = getTextbookLesson("nhip-cau", 3);
  const section = lesson?.sections.find((item) => item.category === "grammar");
  if (!book || !lesson || !section) throw new Error("Expected Nhịp cầu lesson 3 grammar.");
  mockParams = new URLSearchParams("lesson=3&tab=grammar");
  mockSettings = {
   bookDisplayModes: {
    [`static:${book.id}`]: {
     ...DEFAULT_LESSON_DISPLAY_MODE,
     autoDetectPinyin: true,
     showPinyin,
     hanziSize: "lg",
    },
   },
  };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace
    books={books}
    lesson={{ ...lesson, sections: [{ ...section, blocks: section.blocks.slice(0, 4) }] }}
   />,
  );

  expect(markup.includes("<ruby")).toBe(showPinyin);
  expect(markup).toContain("font-size:clamp(1.25rem, 3.5vw, 1.375rem)");
  expect(markup).not.toContain("text-[0.62em]");
 });

 it.each([true, false])(
  "separates grammar translations and interpretation notes (%s)",
  (showMeaning) => {
   const books = getTextbookCatalog();
   const book = books.find((item) => item.key === "nhip-cau");
   const lesson = getTextbookLesson("nhip-cau", 3);
   const section = lesson?.sections.find((item) => item.category === "grammar");
   const heading = section?.blocks[0];
   const example = section?.blocks.find((item) => item.text.startsWith("(6) 情况"));
   if (!book || !lesson || !section || !heading || !example)
    throw new Error("Expected the 从来 comparison.");
   mockParams = new URLSearchParams("lesson=3&tab=grammar");
   mockSettings = {
    bookDisplayModes: {
     [`static:${book.id}`]: { ...DEFAULT_LESSON_DISPLAY_MODE, showMeaning },
    },
   };

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={books}
     lesson={{ ...lesson, sections: [{ ...section, blocks: [heading, example] }] }}
    />,
   );

   expect(markup).toContain('aria-label="Đọc tiếng Trung: 情况从来没好过"');
   expect(markup).not.toContain('aria-label="Đọc từ chữ 情"');
   expect(markup.includes('lang="vi">Tình hình chưa bao giờ tốt.</p>')).toBe(showMeaning);
   expect(markup.includes('lang="vi">vẫn không tốt</p>')).toBe(showMeaning);
  },
 );

 it("preserves the complete narration in both lines of a quoted grammar example", () => {
  const lesson = getTextbookLesson("nhip-cau", 8);
  const section = lesson?.sections.find((item) => item.category === "grammar");
  const heading = section?.blocks[0];
  const example = section?.blocks.find((item) => item.id === "nhip-cau-lesson-08-source-528");
  if (!lesson || !section || !heading || !example)
   throw new Error("Expected the narrated grammar example.");
  mockParams = new URLSearchParams("lesson=8&tab=grammar");

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace
    books={getTextbookCatalog()}
    lesson={{ ...lesson, sections: [{ ...section, blocks: [heading, example] }] }}
   />,
  );

  expect(markup.replace(/<[^>]*>/g, "")).toContain("Ông Bạch kiên quyết nói:");
  expect(markup).toContain("白先生坚决地说");
  expect(markup).toContain("Mọi người đều đang làm việc, làm sao tôi có thể nghỉ?");
 });

 it("keeps split source dialogue turns in the same practice question card and source order", () => {
  const lesson = getTextbookLesson("khau-ngu", 1);
  const section = lesson?.sections.find((item) => item.category === "practice");
  if (!lesson || !section) throw new Error("Expected Khẩu ngữ lesson 1 practice.");
  const firstIndex = section.blocks.findIndex(
   (block) => block.id === "khau-ngu-lesson-01-en-p16-b07",
  );
  const turns = section.blocks.slice(firstIndex, firstIndex + 4);
  const [firstA, firstB, nextA, nextB] = turns;
  if (firstIndex < 0 || !firstA || !firstB || !nextA || !nextB)
   throw new Error("Expected the first two source A/B question pairs.");
  mockParams = new URLSearchParams("lesson=1&tab=practice");

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace
    books={getTextbookCatalog()}
    lesson={{ ...lesson, sections: [{ ...section, blocks: turns }] }}
   />,
  );
  const cards = markup.split('data-slot="card"');
  const firstQuestion = cards.find((card) => card.includes(`id="${firstA.id}"`));
  const nextQuestion = cards.find((card) => card.includes(`id="${nextA.id}"`));
  if (!firstQuestion || !nextQuestion) throw new Error("Expected both practice question cards.");

  expect(firstQuestion).toContain(`id="${firstB.id}"`);
  expect(firstQuestion).not.toContain(`id="${nextA.id}"`);
  expect(firstQuestion).not.toContain(`id="${nextB.id}"`);
  expect(nextQuestion).toContain(`id="${nextB.id}"`);
  expect(nextQuestion).not.toContain(`id="${firstB.id}"`);
  const positions = turns.map((block) => markup.indexOf(`id="${block.id}"`));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((left, right) => left - right));
 });

 it.each([true, false])(
  "preserves practice learner font, size and pinyin with a subordinate instruction heading (%s)",
  (showPinyin) => {
   const books = getTextbookCatalog();
   const book = books.find((item) => item.key === "khau-ngu");
   const lesson = getTextbookLesson("khau-ngu", 1);
   const section = lesson?.sections.find((item) => item.category === "practice");
   const instruction = section?.blocks.find(
    (block) => block.id === "khau-ngu-lesson-01-en-p16-b01",
   );
   const firstA = section?.blocks.find((block) => block.id === "khau-ngu-lesson-01-en-p16-b07");
   const firstB = section?.blocks.find((block) => block.id === "khau-ngu-lesson-01-en-p16-b08");
   if (!book || !lesson || !section || !instruction || !firstA || !firstB)
    throw new Error("Expected the source dialogue completion exercise.");
   mockParams = new URLSearchParams("lesson=1&tab=practice");
   mockSettings = {
    bookDisplayModes: {
     [`static:${book.id}`]: {
      ...DEFAULT_LESSON_DISPLAY_MODE,
      autoDetectPinyin: true,
      showPinyin,
      hanziFont: "songti",
      hanziSize: "lg",
     },
    },
   };

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={books}
     lesson={{ ...lesson, sections: [{ ...section, blocks: [instruction, firstA, firstB] }] }}
    />,
   );
   const instructionMarkup = markup.slice(
    markup.indexOf(`id="${instruction.id}"`),
    markup.indexOf(`id="${firstA.id}"`),
   );
   const question = markup
    .split('data-slot="card"')
    .find((card) => card.includes(`id="${firstA.id}"`));
   if (!question) throw new Error("Expected the practice question card.");

   expect(instructionMarkup).toMatch(/<h3\b|role="heading" aria-level="3"/);
   expect(instructionMarkup).not.toMatch(/<h2\b|role="heading" aria-level="2"/);
   expect(question.includes("<ruby")).toBe(showPinyin);
   expect(question).toContain("font-family:var(--font-reading-noto-serif)");
   expect(question).toContain("font-size:clamp(1.25rem, 3.5vw, 1.375rem)");
  },
 );

 it("renders the fourth review with hidden source answers and no invented Bài 24 heading", () => {
  const lesson = getTextbookLesson("khau-ngu", 24);
  if (!lesson) throw new Error("Expected fourth Khẩu ngữ review.");
  mockParams = new URLSearchParams("lesson=24&tab=practice");
  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={lesson} />,
  );
  expect(markup).toContain(lesson.title);
  expect(markup).not.toContain("Bài 24");
  expect(markup).toContain("Hiện đáp án");
  expect(markup).not.toContain("正确答案：");
  expect(markup).toContain("城市交通");
  expect(markup).toContain("环保知识");
 });

 it.each([5, 7, 9])(
  "keeps the school source exercise image and original lesson number for Khẩu ngữ %i",
  (number) => {
   const lesson = getTextbookLesson("khau-ngu", number);
   if (!lesson) throw new Error(`Expected Khẩu ngữ lesson ${number}.`);
   mockParams = new URLSearchParams(`lesson=${number}&tab=practice`);
   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={lesson} />,
   );
   const images = lesson.sections
    .flatMap((section) => section.blocks)
    .flatMap((block) => (block.image ? [block.image] : []));
   expect(images).toHaveLength(1);
   for (const image of images) {
    expect(markup).toContain(`src="${image.src}"`);
    expect(markup).toContain(`alt="${image.alt}"`);
    expect(markup).toContain(`width="${image.width}"`);
    expect(markup).toContain(`height="${image.height}"`);
   }
   expect(markup).not.toContain("/_next/image");
   expect(markup).toContain(lesson.title);
   expect(markup).not.toContain(`Bài ${number}/5`);
   expect(markup).not.toContain("Hiện đáp án");
  },
 );

 it.each(getTextbookCatalog())(
  "omits the duplicate book sidebar for $label",
  (book) => {
   const lesson = getTextbookLesson(book.key, 1);
   if (!lesson) throw new Error(`Expected first lesson of ${book.key}.`);
   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={lesson} />,
   );
   expect(markup).not.toContain(businessChineseMessages.sidebarLabel);
   expect(markup).not.toContain(businessChineseMessages.bookSelectLabel);
   expect(markup).not.toContain("<aside");
   expect(markup).not.toContain("xl:grid-cols-[3.25rem_minmax(0,1fr)]");
   expect(markup).toContain("Trong trang");
   expect(markup).toContain("Nghe bài");
   expect(markup).toContain("2xl:grid-cols-[15rem_minmax(0,1fr)]");
   expect(markup.indexOf("Trong trang")).toBeLessThan(markup.indexOf("data-reader-toolbar"));
   expect(markup).toContain('<span class="min-w-0 truncate">');
  },
  15_000,
 );

 it.each(["nhip-cau", "doc-hieu", "khau-ngu"])(
  "keeps real %s source sections in order with one All-view reader per source text section",
  (bookKey) => {
   const book = getTextbookCatalog().find((item) => item.key === bookKey);
   const lesson = book ? getTextbookLesson(book.key, 1) : null;
   if (!lesson) throw new Error(`Expected ${bookKey} lesson 1.`);
   readerDocumentMock.mockClear();
   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace books={getTextbookCatalog()} lesson={lesson} />,
   );
   const positions = lesson.sections.map((section) => markup.indexOf(`id="${section.id}"`));

   expect(positions.every((position) => position >= 0)).toBe(true);
   expect(positions).toEqual([...positions].sort((left, right) => left - right));
   const textSections = lesson.sections.filter((section) => section.category === "text");
   const readers = readerDocumentMock.mock.calls.map(([document]) => document);
   expect(readers.map((reader) => reader.sections.map((section) => section.id))).toEqual(
    textSections.map((section) => [section.id]),
   );
   expect(new Set(readers.map((reader) => reader.id)).size).toBe(textSections.length);
   for (const reader of readers) {
    expect(reader.segments.every((segment) => segment.sectionId === reader.sections[0]?.id)).toBe(
     true,
    );
   }
   expect(readers.slice(1).every((reader) => !reader.title && !reader.titleVi)).toBe(true);
   expect(markup.match(/data-reader-toolbar/g)).toHaveLength(textSections.length);

   expect(markup).toContain("Từ vựng bài này");
   expect(markup).toContain(`${lesson.vocab.length} từ chính`);
  },
  15_000,
 );

 it("uses the same reader for all five unit articles without dropping temperatures or meanings", () => {
  const lesson = getTextbookLesson("doc-hieu", 1);
  if (!lesson) throw new Error("Expected Đọc hiểu unit 1.");
  const textSections = lesson.sections.filter((section) => section.category === "text");
  const sourceBlock = textSections[0]?.blocks[0];
  if (!sourceBlock) throw new Error("Expected the source weather forecast.");

  readerDocumentMock.mockClear();
  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace
    books={getTextbookCatalog()}
    lesson={{ ...lesson, sections: textSections }}
   />,
  );
  const readers = readerDocumentMock.mock.calls.map(([document]) => document);
  const segments = readers.flatMap((reader) => reader.segments);

  expect(readers).toHaveLength(5);
  expect(readers.every((reader) => reader.sections.length === 1)).toBe(true);
  expect(segments[0]).toMatchObject({
   zh: sourceBlock.text,
   speechText: sourceBlock.text,
   vi: sourceBlock.translation,
  });
  expect(segments[0]?.speechText).toContain("-5℃");
  expect(markup).toContain("Bài 1/18");
  expect(markup).toContain("Nghe bài");
  expect(markup).toContain("Công cụ học");
  expect(markup).toContain("text-warning");
  expect(markup).not.toContain("decoration-dotted");
  expect(markup).not.toContain(">Ngữ pháp<");
  for (const section of textSections) expect(markup).toContain(`id="${section.id}"`);
 });

 it("preserves Nhịp cầu narrative colons and their complete source translations", () => {
  const lesson = getTextbookLesson("nhip-cau", 1);
  if (!lesson) throw new Error("Expected Nhịp cầu lesson 1.");
  const section = lesson.sections.find((item) => item.category === "text");
  const paragraph = section?.blocks.find((block) => block.text.startsWith("邮包上的字"));
  if (!section || !paragraph) throw new Error("Expected the source narrative paragraph.");

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace
    books={getTextbookCatalog()}
    lesson={{ ...lesson, sections: [{ ...section, blocks: [paragraph] }] }}
   />,
  );
  const reader = readerDocumentMock.mock.calls.at(-1)?.[0];

  expect(reader?.segments).toHaveLength(1);
  expect(reader?.segments[0]).toMatchObject({
   zh: paragraph.text,
   speechText: paragraph.text,
   vi: paragraph.translation,
  });
  expect(reader?.segments[0]?.speaker).toBeUndefined();
  expect(markup).toContain("Bài 1/15");
  expect(markup).toContain(
   "Những chữ trên bưu kiện nguệch ngoạc, như đang nhảy múa kể cho tôi nghe:",
  );
 });

 it.each(getTextbookCatalog())(
  "renders $label vocabulary from the canonical lesson list as cards",
  (book) => {
   const lesson = getTextbookLesson(book.key, 1);
   if (!lesson) throw new Error(`Expected first lesson of ${book.key}.`);
   const section = lesson.sections.find((item) =>
    item.blocks.some(
     (block) =>
      block.type === "table" &&
      block.rows.length === lesson.vocab.length + 1 &&
      block.rows[1]?.includes(lesson.vocab[0]?.hanzi ?? ""),
    ),
   );
   if (!section) throw new Error(`Expected canonical vocabulary source for ${book.key}.`);
   const firstWord = lesson.vocab[0];
   if (!firstWord) throw new Error(`Expected vocabulary for ${book.key}.`);

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={getTextbookCatalog()}
     lesson={{ ...lesson, sections: [section] }}
    />,
   );

   expect(markup).toContain("Từ vựng bài này");
   expect(markup).toContain(`${lesson.vocab.length} từ chính`);
   expect(markup).toContain("Mở từ vựng");
   expect(markup).toContain(firstWord.hanzi);
   expect(markup).toContain("<ruby");
   expect(markup).toContain(`aria-label="Đọc tiếng Trung: ${firstWord.hanzi}"`);
   expect(markup).toContain(firstWord.hanviet || firstWord.pos);
   expect(markup).toContain(firstWord.meaning);
   expect(markup).toContain("max-h-80");
   expect(markup).not.toContain(">STT<");
  },
  15_000,
 );

 it.each(getTextbookCatalog())(
  "uses vocabulary cards for every vocabulary table in $label",
  (book) => {
   const lessonNumber =
    book.key === "tm2" ? 6 : book.key === "tm3" ? 10 : book.key === "nhip-cau" ? 2 : 1;
   const lesson = getTextbookLesson(book.key, lessonNumber);
   if (!lesson) throw new Error(`Expected vocabulary lesson for ${book.key}.`);
   mockParams = new URLSearchParams(`lesson=${lesson.number}&tab=vocab`);

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={getTextbookCatalog()}
     lesson={{
      ...lesson,
      sections: lesson.sections.filter((section) => section.category === "vocab"),
     }}
    />,
   );

   expect(markup.includes("<table")).toBe(false);
   expect(markup).toContain("Từ vựng bài này");
   if (book.key === "nhip-cau") {
    expect(markup).toContain('aria-label="Đọc tiếng Trung: 西安"');
    expect(markup).toContain("(thành phố) Tây An");
    expect(markup).toContain('aria-label="Đọc tiếng Trung: 娘家"');
    expect(markup).toContain("nhà mẹ đẻ (của phụ nữ đã lấy chồng)");
    expect(markup).toContain("nương gia");
    expect(markup).toContain('id="nhip-cau-lesson-02-source-54"');
    expect(markup).toContain('id="nhip-cau-lesson-02-source-506"');
   }
   if (book.key === "tm2") expect(markup).toContain("公務艙");
   if (book.key === "tm3") expect(markup).toContain(">Bài<");
  },
  15_000,
 );

 it.each([true, false])(
  "preserves vocabulary card display settings and audio (%s)",
  (showDetails) => {
   const books = getTextbookCatalog();
   const book = books.find((item) => item.key === "nhip-cau");
   const lesson = getTextbookLesson("nhip-cau", 2);
   const section = lesson?.sections.find((item) => item.category === "vocab");
   const firstWord = lesson?.vocab[0];
   if (!book || !lesson || !section || !firstWord)
    throw new Error("Expected Nhịp cầu vocabulary cards.");
   mockParams = new URLSearchParams("lesson=2&tab=vocab");
   mockSettings = {
    bookDisplayModes: {
     [`static:${book.id}`]: {
      ...DEFAULT_LESSON_DISPLAY_MODE,
      autoDetectPinyin: true,
      showPinyin: showDetails,
      showMeaning: showDetails,
      revealMode: "tap",
     },
    },
   };

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace books={books} lesson={{ ...lesson, sections: [section] }} />,
   );

   expect(markup.includes("<table")).toBe(false);
   expect(markup.includes("<ruby")).toBe(showDetails);
   expect(markup.includes("nương gia")).toBe(showDetails);
   expect(markup.includes("nhà mẹ đẻ (của phụ nữ đã lấy chồng)")).toBe(showDetails);
   expect(markup.includes(firstWord.meaning)).toBe(showDetails);
   expect(markup).toContain('aria-label="Đọc tiếng Trung: 娘家"');
   expect(markup).toContain('aria-label="Đọc tiếng Trung: 西安"');
   expect(markup).toContain(`aria-label="Đọc tiếng Trung: ${firstWord.hanzi}"`);
  },
 );

 it.each([true, false])(
  "preserves vocabulary expansion visibility with tap reveal enabled (%s)",
  (showDetails) => {
   const books = getTextbookCatalog();
   const book = books.find((item) => item.key === "nhip-cau");
   const lesson = getTextbookLesson("nhip-cau", 3);
   const section = lesson?.sections.find((item) => item.title.includes("词语搭配与扩展"));
   if (!book || !lesson || !section) throw new Error("Expected Nhịp cầu vocabulary expansion.");
   mockParams = new URLSearchParams("lesson=3&tab=vocab");
   mockSettings = {
    bookDisplayModes: {
     [`static:${book.id}`]: {
      ...DEFAULT_LESSON_DISPLAY_MODE,
      autoDetectPinyin: true,
      showPinyin: showDetails,
      showMeaning: showDetails,
      revealMode: "tap",
     },
    },
   };

   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={books}
     lesson={{ ...lesson, sections: [{ ...section, blocks: section.blocks.slice(0, 5) }] }}
    />,
   );

   expect(markup.includes("<ruby")).toBe(showDetails);
   expect(markup.includes("định nhét vào")).toBe(showDetails);
   expect(markup).toContain('aria-label="Đọc tiếng Trung: 打算塞进去"');
   expect(markup).not.toContain("Hiện pinyin");
   expect(markup).not.toContain("Hiện nghĩa");
  },
 );

 it.each([
  { unit: 1, promptCells: 3 },
  { unit: 8, promptCells: 0 },
 ])(
  "hides source answer columns while preserving prompt cells in unit $unit",
  ({ unit, promptCells }) => {
   const lesson = getTextbookLesson("doc-hieu", unit);
   if (!lesson) throw new Error(`Expected Đọc hiểu unit ${unit}.`);
   const section = lesson.sections.find((item) =>
    item.blocks.some((block) => block.answerColumnIndexes?.length),
   );
   const table = section?.blocks.find((block) => block.answerColumnIndexes?.length);
   if (!section || !table) throw new Error("Expected the source weather answer table.");
   const markup = renderWorkspace(
    <BusinessChineseStudyWorkspace
     books={getTextbookCatalog()}
     lesson={{ ...lesson, sections: [{ ...section, blocks: [table] }] }}
    />,
   );

   expect(markup).toContain("Hiện đáp án");
   expect(markup).toContain('aria-expanded="false"');
   expect(markup.match(/<td\b/g) ?? []).toHaveLength(promptCells);
   expect(markup).not.toContain("-5℃");
   expect(markup).not.toContain("-3℃");
  },
 );

 it("renders the ordered source document with tabs, ruby pinyin, and no connected content load", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 2);
  if (!lesson) throw new Error("Expected Business Chinese lesson 2.");
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);

  expect(markup).toContain("Toàn bài");
  expect(markup).toContain("Câu chủ đề");
  expect(markup).toContain("Bài tập");
  expect(markup).toContain("GIỚI THIỆU TỔNG QUAN");
  expect(markup).toContain("BÀI KHÓA CHÍNH");
  expect(markup).toContain("电话会议");
  expect(markup).toContain("Đoạn 1 /");
  expect(markup).toContain("Nghe bài");
  expect(markup).toContain("Công cụ học");
  expect(markup.includes(`aria-label="${businessChineseMessages.tabsLabel}"`)).toBe(true);
  expect(markup).not.toContain("lucide-panel-left-open");
  expect(markup).toContain("<ruby");
  expect(markup).toContain('lang="zh-CN"');
  expect(markup).toContain('lang="zh-Latn-pinyin"');
  expect(markup).toContain('aria-label="Đọc tiếng Trung:');
  expect(markup).not.toContain("Vậy là tôi đã xuất");
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
 });

 it("keeps inline exercise answers hidden while preserving pinyin and TTS for the prompt", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 2);
  if (!lesson) throw new Error("Expected Business Chinese lesson 2.");
  const sourceSection = lesson.sections.find((section) =>
   section.blocks.some((block) => block.text.startsWith("这个设计图 ______")),
  );
  const sourceBlock = sourceSection?.blocks.find((block) =>
   block.text.startsWith("这个设计图 ______"),
  );
  if (!sourceSection || !sourceBlock) throw new Error("Expected the representative exercise.");
  const focusedLesson = {
   ...lesson,
   sections: [{ ...sourceSection, blocks: [sourceBlock] }],
  };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).not.toContain("这个设计图画得很漂亮。");
  expect(markup).toContain("Hiện đáp án");
  expect(markup).toContain("<ruby");
  expect(markup).toContain('aria-label="Đọc tiếng Trung: 这个设计图 很漂亮。"');
 });

 it("pairs the separate lesson translation with each Chinese turn and excludes the speaker from TTS", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");
  const mainSection = lesson.sections.find((section) => section.title.includes("BÀI KHÓA CHÍNH"));
  const translationSection = lesson.sections.find((section) =>
   section.title.includes("DỊCH BÀI KHÓA"),
  );
  if (!mainSection || !translationSection) {
   throw new Error("Expected paired source and translation sections.");
  }
  const focusedLesson = {
   ...lesson,
   sections: [mainSection, translationSection],
  };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).toContain("赵经理");
  expect(markup).toContain("Xin chào! Cho tôi hỏi có phải là Giám đốc Tôn không ạ?");
  expect(markup).not.toContain("DỊCH BÀI KHÓA");
  expect(markup).toContain("data-reader-segment=");
  expect(markup).toContain('aria-label="Đọc từ chữ 您"');
  expect(markup).not.toContain('aria-label="Đọc tiếng Trung: 赵经理： 您好！请问是孙经理吗？"');
  expect(markup).toContain("60%");
  expect(readerDocumentMock).toHaveBeenLastCalledWith(
   expect.objectContaining({
    segments: expect.arrayContaining([
     expect.objectContaining({
      zh: "您好！请问是孙经理吗？",
      speechText: "您好！请问是孙经理吗？",
      speaker: { label: "赵经理" },
      vi: "Xin chào! Cho tôi hỏi có phải là Giám đốc Tôn không ạ?",
     }),
    ]),
   }),
  );
  expect(markup).toContain('aria-label="Pinyin chữ 行 cần kiểm tra"');
  expect(markup).toContain("text-warning");
  expect(markup).not.toContain("decoration-dotted");
  expect(markup).toContain("Công cụ học");
 });

 it("renders inline lesson translations with the same speaker and TTS structure", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 3);
  if (!lesson) throw new Error("Expected Business Chinese lesson 3.");
  const mainSection = lesson.sections.find((section) => section.title.includes("BÀI KHÓA CHÍNH"));
  if (!mainSection) throw new Error("Expected the representative inline-translation section.");
  const focusedLesson = { ...lesson, sections: [mainSection] };

  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).toContain("杜森");
  expect(markup).toContain(
   "Xin chào, tôi là Đỗ Sâm của Công ty Moore Mỹ, đây là danh thiếp của tôi.",
  );
  expect(markup).toContain('aria-label="Đọc từ chữ 您"');
  expect(readerDocumentMock).toHaveBeenLastCalledWith(
   expect.objectContaining({
    segments: expect.arrayContaining([
     expect.objectContaining({
      speechText: "您好，我是美国摩尔公司的杜森，这是我的名片。",
      speaker: { label: "杜森" },
      vi: "Xin chào, tôi là Đỗ Sâm của Công ty Moore Mỹ, đây là danh thiếp của tôi.",
     }),
    ]),
   }),
  );
  expect(markup).not.toContain(
   'aria-label="Đọc tiếng Trung: 杜森： 您好，我是美国摩尔公司的杜森，这是我的名片。"',
  );
 });

 it("includes Ghi chú and Luyện dịch in the workspace tabs", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");

  const focusedLesson = {
   ...lesson,
   sections: lesson.sections.map((section) => ({ ...section, blocks: section.blocks.slice(0, 1) })),
   vocab: lesson.vocab.slice(0, 1),
  };
  const markup = renderWorkspace(
   <BusinessChineseStudyWorkspace books={books} lesson={focusedLesson} />,
  );

  expect(markup).toContain("Ghi chú");
  expect(markup).toContain("Luyện dịch");
  expect(markup).toContain("Nghe chép");
 });

 it("renders the notes tab content when tab=notes is active", () => {
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");

  vi.mocked(routerPushMock).mockClear();
  mockParams = new URLSearchParams("lesson=1&tab=notes");
  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);

  expect(markup).toContain("Ghi chú");
  expect(markup).toContain("Chưa có ghi chú riêng cho bài này.");
  expect(markup).not.toContain("data-reader-segment=");
 });

 it("includes a Bookmark button on the lesson header and toolbar", () => {
  mockBookmarkedLessonIds = [];
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);

  expect(markup).toContain("Đánh dấu bài học kỳ này");
 });

 it("indicates when the current lesson is bookmarked", () => {
  mockBookmarkedLessonIds = ["business-chinese-tm2-lesson-01"];
  const books = getBusinessChineseCatalog();
  const lesson = getBusinessChineseLesson("tm2", 1);
  if (!lesson) throw new Error("Expected Business Chinese lesson 1.");

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);

  expect(markup).toContain("Đã đánh dấu");
 });
});

describe("textbook persisted settings and view", () => {
 const displayBookKeys: TextbookLesson["bookKey"][] = ["nhip-cau", "doc-hieu"];

 it.each(displayBookKeys)("uses the saved display only for the matching book (%s)", (bookKey) => {
  const books = getTextbookCatalog();
  const book = books.find((item) => item.key === bookKey);
  const lesson = getTextbookLesson(bookKey, 1);
  if (!book || !lesson) throw new Error("Missing textbook fixture");
  const display = {
   ...DEFAULT_LESSON_DISPLAY_MODE,
   hanziSize: "lg",
  } satisfies LessonTextDisplaySettings;
  mockSettings = {
   bookDisplayModes: {
    [`static:${book.id}`]: bookKey === "nhip-cau" ? display : DEFAULT_LESSON_DISPLAY_MODE,
   },
  };
  readerDisplayMock.mockClear();
  renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);
  expect(
   readerDisplayMock.mock.calls.every(
    ([value]) => value.hanziSize === (bookKey === "nhip-cau" ? "lg" : "3xl"),
   ),
  ).toBe(true);
 });
 it.each(["lesson=1&tab=text", "lesson=1", "lesson=1&tab=removed"])(
  "honors explicit lesson/tab and validates the saved view for %s",
  (query) => {
   const books = getTextbookCatalog();
   const book = books.find((item) => item.key === "nhip-cau");
   const lesson = getTextbookLesson("nhip-cau", 1);
   if (!book || !lesson) throw new Error("Missing textbook fixture");
   mockSettings = {
    bookResume: { [`static:${book.id}`]: { lessonId: lesson.id, module: "vocab" } },
   };
   mockParams = new URLSearchParams(query);
   readerDocumentMock.mockClear();
   const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);
   if (mockParams.get("tab") === "text") {
    expect(
     readerDocumentMock.mock.calls.some(([document]) => document.id === `${lesson.id}:text`),
    ).toBe(true);
   } else {
    expect(markup).toContain(
     `aria-label="${businessChineseMessages.tabsLabel}: ${businessChineseMessages.tabs.all}"`,
    );
   }
  },
 );

 it("renders lesson immediately even when learning state is loading (offline readiness)", () => {
  const books = getTextbookCatalog();
  const lesson = getTextbookLesson("nhip-cau", 2);
  if (!lesson) throw new Error("Missing textbook fixture");
  mockIsLoading = true;
  mockParams = new URLSearchParams("lesson=2&tab=text");
  readerDocumentMock.mockClear();

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson} />);
  expect(markup).not.toContain('sr-only">Đang tải bài học');
  expect(
   readerDocumentMock.mock.calls.some(([document]) => document.id === `${lesson.id}:text`),
  ).toBe(true);
 });

 it("resolves lesson 2 dynamically from searchParams when initialLesson is lesson 1", () => {
  const books = getTextbookCatalog();
  const lesson1 = getTextbookLesson("nhip-cau", 1);
  const lesson2 = getTextbookLesson("nhip-cau", 2);
  if (!lesson1 || !lesson2) throw new Error("Missing textbook fixture");
  mockParams = new URLSearchParams("lesson=2&tab=text");
  readerDocumentMock.mockClear();

  const markup = renderWorkspace(<BusinessChineseStudyWorkspace books={books} lesson={lesson1} />);
  expect(markup).not.toContain('sr-only">Đang tải bài học');
  expect(
   readerDocumentMock.mock.calls.some(([document]) => document.id === `${lesson2.id}:text`),
  ).toBe(true);
 });
});
