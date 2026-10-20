import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { usePrefetchHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import { getTextbookCatalogForBookKeys } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import type { AppLocale } from "@/i18n/config";
import { loadAppMessages } from "@/i18n/messages";
import type { useRouter } from "@/i18n/navigation";
import { RecentLearningCard } from "./RecentLearningCard";
import { resolveRecentLearning } from "./recent-learning";

const { mockLearningState } = vi.hoisted(() => {
 const mockLearningState: ReturnType<typeof useLearningState> = {
  state: {
   settings: {},
   progress: { vocab: {}, grammar: {} },
   bookmarks: { lessons: [], vocab: [], grammar: [], radicals: [] },
   reviewHistory: [],
  },
  isLoading: false,
  isSaving: false,
  isError: false,
  isOnline: true,
  syncStatus: "synced",
  durability: "durable",
  pendingSyncCount: 0,
  lastSyncError: null,
  retrySync: async () => ({ status: "synced", syncedCount: 0, pendingCount: 0 }),
  updateSettings: () => undefined,
  updateVocabProgress: () => undefined,
  updateGrammarProgress: () => undefined,
  toggleBookmark: () => undefined,
  appendReviewHistory: () => undefined,
  recordReview: () => undefined,
 };
 return { mockLearningState };
});

vi.mock("@/features/hanzihome/hooks/useLearningState", () => ({
 useLearningState: () => mockLearningState,
}));

vi.mock("@/features/hanzihome/hooks/useHanziHomeLessonResources", () => ({
 usePrefetchHanziHomeLesson: () => vi.fn<ReturnType<typeof usePrefetchHanziHomeLesson>>(),
}));

vi.mock("@/i18n/navigation", () => ({
 Link: (props: ComponentProps<"a">) => createElement("a", props),
 useRouter: (): ReturnType<typeof useRouter> => ({
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "recent-learning",
 }),
}));

const course: HanziHomeCatalogCourse = {
 id: "course-1",
 slug: "course-1",
 title: "Giáo trình Hán ngữ",
 type: "textbook",
 order: 1,
 stats: { bookCount: 1, lessonCount: 1, vocabCount: 10, grammarCount: 2 },
};

const book: HanziHomeCourseBook = {
 id: "book-1",
 courseId: course.id,
 title: "Quyển 1",
 order: 1,
};

const lesson: HanziHomeLesson = {
 id: "lesson-1",
 lessonNumber: 3,
 titleZh: "你叫什么名字",
 title: "Bạn tên là gì?",
 courseId: course.id,
 bookId: book.id,
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
};

describe("resolveRecentLearning", () => {
 it("builds the resume target from the saved course, lesson, and module", () => {
  const result = resolveRecentLearning({
   courses: [course],
   books: [book],
   lessons: [lesson],
   courseId: course.id,
   lessonId: lesson.id,
   module: "grammar",
  });

  expect(result?.href).toBe("/hanzihome?courseId=course-1&bookId=book-1&lesson=3&module=grammar");
  expect(result?.book?.id).toBe(book.id);
  expect(result?.module).toBe("grammar");
 });

 it("ignores stale state when the lesson belongs to another course", () => {
  expect(
   resolveRecentLearning({
    courses: [course],
    books: [book],
    lessons: [{ ...lesson, courseId: "course-2" }],
    courseId: course.id,
    lessonId: lesson.id,
    module: "overview",
   }),
  ).toBeNull();
 });

 it("returns no card when the saved lesson is missing", () => {
  expect(
   resolveRecentLearning({
    courses: [course],
    books: [book],
    lessons: [],
    courseId: course.id,
    lessonId: lesson.id,
    module: "overview",
   }),
  ).toBeNull();
 });
});

describe("RecentLearningCard", () => {
 beforeEach(() => {
  mockLearningState.state.settings = {};
  mockLearningState.isLoading = false;
  mockLearningState.isError = false;
  mockLearningState.updateSettings = vi.fn<ReturnType<typeof useLearningState>["updateSettings"]>();
 });

 it("resumes each saved book and preserves the real textbook review title and module", async () => {
  mockLearningState.state.settings = {
   lastModule: "vocab",
   bookResume: {
    "catalog:book-1": { lessonId: lesson.id, module: "grammar" },
    "static:khau-ngu": { lessonId: "khau-ngu-review-04", module: "practice" },
   },
  };
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book]}
     lessons={[lesson]}
     textbooks={getTextbookCatalogForBookKeys(["khau-ngu"])}
    />
   </NextIntlClientProvider>,
  );
  const text = markup.replace(/<[^>]+>/g, "");

  expect(markup).toContain(
   'href="/hanzihome?courseId=course-1&amp;bookId=book-1&amp;lesson=3&amp;module=grammar"',
  );
  expect(markup).toContain('href="/hsk/khau-ngu-tc1?lesson=24&amp;tab=practice"');
  expect(markup.match(/<a /g)).toHaveLength(2);
  expect(text).toContain("Giáo trình Hán ngữ · Quyển 1");
  expect(text).toContain("Bài 3: 你叫什么名字");
  expect(text).toContain("Ngữ pháp");
  expect(text).toContain("Khẩu ngữ Trung cấp 1");
  expect(text).toContain("ÔN TẬP 4: 国际婚姻");
  expect(text).toContain("Bài tập");
  expect(text).not.toContain("Bài 24");
  expect(
   Array.from(markup.matchAll(/data-library-resume="([^"]+)"/g), (match) => match[1]),
  ).toEqual(["catalog:book-1", "static:khau-ngu"]);
  expect(mockLearningState.updateSettings).not.toHaveBeenCalled();
 });

 it.each([
  { lessonId: lesson.id, lessonNumber: lesson.lessonNumber },
  { lessonId: "lesson-2", lessonNumber: 4 },
 ])(
  "keeps the saved book position with current lesson $lessonId and appends newly started books",
  async ({ lessonId, lessonNumber }) => {
   mockLearningState.state.settings = {
    libraryCollectionOrder: ["group:hanyu", "static:khau-ngu"],
    libraryResumeOrder: [
     "static:khau-ngu",
     "catalog:book-1",
     "static:removed-book",
     "catalog:book-1",
    ],
    bookResume: {
     "catalog:book-1": { lessonId, module: "grammar" },
     "catalog:book-2": { lessonId: "lesson-other-book", module: "vocab" },
     "static:khau-ngu": { lessonId: "khau-ngu-review-04", module: "practice" },
    },
   };
   const messages = await loadAppMessages("vi");
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <RecentLearningCard
      courses={[course]}
      books={[book, { ...book, id: "book-2", title: "Quyển 2" }]}
      lessons={[
       lesson,
       { ...lesson, id: "lesson-2", lessonNumber: 4, titleZh: "明天见" },
       { ...lesson, id: "lesson-other-book", bookId: "book-2", lessonNumber: 5 },
      ]}
      textbooks={getTextbookCatalogForBookKeys(["khau-ngu"])}
     />
    </NextIntlClientProvider>,
   );

   expect(
    Array.from(markup.matchAll(/data-library-resume="([^"]+)"/g), (match) => match[1]),
   ).toEqual(["static:khau-ngu", "catalog:book-1", "catalog:book-2"]);
   expect(markup).toContain(
    `href="/hanzihome?courseId=course-1&amp;bookId=book-1&amp;lesson=${lessonNumber}&amp;module=grammar"`,
   );
   expect(markup).toContain('href="/hsk/khau-ngu-tc1?lesson=24&amp;tab=practice"');
   expect(markup.match(/<a /g)).toHaveLength(3);
   expect(markup).not.toContain("removed-book");
   expect(mockLearningState.updateSettings).not.toHaveBeenCalled();
  },
 );

 it("keeps resume links readable while disabling reordering after a learning-state error", async () => {
  mockLearningState.isError = true;
  mockLearningState.state.settings = {
   bookResume: {
    "catalog:book-1": { lessonId: lesson.id, module: "grammar" },
    "static:khau-ngu": { lessonId: "khau-ngu-review-04", module: "practice" },
   },
  };
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book]}
     lessons={[lesson]}
     textbooks={getTextbookCatalogForBookKeys(["khau-ngu"])}
    />
   </NextIntlClientProvider>,
  );

  expect(markup.match(/data-library-resume=/g)).toHaveLength(2);
  expect(markup.match(/<a /g)).toHaveLength(2);
  expect(markup.match(/ disabled=""/g)).toHaveLength(2);
  expect(markup).not.toContain('draggable="true"');
  expect(mockLearningState.updateSettings).not.toHaveBeenCalled();
 });

 it("does not suggest a resume lesson when no book has been started", async () => {
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book]}
     lessons={[lesson]}
     textbooks={getTextbookCatalogForBookKeys(["khau-ngu"])}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toBe("");
 });

 it("ignores stale and wrong-book resume records instead of starting another lesson", async () => {
  mockLearningState.state.settings = {
   lastCourseId: course.id,
   lastLessonId: "missing-global-lesson",
   lastModule: "vocab",
   bookResume: {
    "catalog:book-1": { lessonId: lesson.id, module: "grammar" },
    "catalog:book-2": { lessonId: "missing-book-lesson", module: "grammar" },
    "static:khau-ngu": { lessonId: "missing-static-lesson", module: "practice" },
   },
  };
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book, { ...book, id: "book-2" }]}
     lessons={[{ ...lesson, bookId: "book-2" }]}
     textbooks={getTextbookCatalogForBookKeys(["khau-ngu"])}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toBe("");
 });

 it.each([
  { name: "stale", resumeLessonId: "missing-book-lesson" },
  { name: "wrong-book", resumeLessonId: "lesson-in-another-book" },
 ])(
  "does not resurrect global fallback for an explicit $name book resume",
  async ({ resumeLessonId }) => {
   mockLearningState.state.settings = {
    lastCourseId: course.id,
    lastLessonId: lesson.id,
    lastModule: "vocab",
    bookResume: { "catalog:book-1": { lessonId: resumeLessonId, module: "grammar" } },
   };
   const messages = await loadAppMessages("vi");
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <RecentLearningCard
      courses={[course]}
      books={[book, { ...book, id: "book-2" }]}
      lessons={[lesson, { ...lesson, id: "lesson-in-another-book", bookId: "book-2" }]}
      textbooks={[]}
     />
    </NextIntlClientProvider>,
   );

   expect(markup).toBe("");
  },
 );

 it("keeps the global last-lesson fallback alongside another book's saved resume", async () => {
  mockLearningState.state.settings = {
   lastCourseId: course.id,
   lastLessonId: lesson.id,
   lastModule: "vocab",
   bookResume: { "catalog:book-2": { lessonId: "lesson-2", module: "grammar" } },
  };
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book, { ...book, id: "book-2", title: "Quyển 2" }]}
     lessons={[lesson, { ...lesson, id: "lesson-2", bookId: "book-2", lessonNumber: 4 }]}
     textbooks={[]}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain(
   'href="/hanzihome?courseId=course-1&amp;bookId=book-1&amp;lesson=3&amp;module=vocab"',
  );
  expect(markup).toContain(
   'href="/hanzihome?courseId=course-1&amp;bookId=book-2&amp;lesson=4&amp;module=grammar"',
  );
  expect(markup.match(/<a /g)).toHaveLength(2);
  expect(markup).toContain("Từ vựng");
 });

 it("deduplicates global fallback by book and keeps that book's saved lesson and module", async () => {
  mockLearningState.state.settings = {
   lastCourseId: course.id,
   lastLessonId: "lesson-2",
   lastModule: "vocab",
   bookResume: { "catalog:book-1": { lessonId: lesson.id, module: "grammar" } },
  };
  const messages = await loadAppMessages("vi");
  const markup = renderToStaticMarkup(
   <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
    <RecentLearningCard
     courses={[course]}
     books={[book]}
     lessons={[lesson, { ...lesson, id: "lesson-2", lessonNumber: 4, titleZh: "明天见" }]}
     textbooks={[]}
    />
   </NextIntlClientProvider>,
  );

  expect(markup).toContain(
   'href="/hanzihome?courseId=course-1&amp;bookId=book-1&amp;lesson=3&amp;module=grammar"',
  );
  expect(markup.match(/<a /g)).toHaveLength(1);
  expect(markup).not.toContain("lesson=4");
  expect(markup).not.toContain("明天见");
 });

 it.each([
  { locale: "vi", heading: "Tiếp tục học", resume: "Tiếp tục", grammar: "Ngữ pháp" },
  { locale: "en", heading: "Continue learning", resume: "Continue", grammar: "Grammar" },
  { locale: "zh-CN", heading: "继续学习", resume: "继续学习", grammar: "语法" },
 ] satisfies { locale: AppLocale; heading: string; resume: string; grammar: string }[])(
  "renders real recent-learning messages for $locale",
  async ({ locale, heading, resume, grammar }) => {
   mockLearningState.state.settings = {
    bookResume: { "catalog:book-1": { lessonId: lesson.id, module: "grammar" } },
   };
   const messages = await loadAppMessages(locale);
   const markup = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
     <RecentLearningCard courses={[course]} books={[book]} lessons={[lesson]} textbooks={[]} />
    </NextIntlClientProvider>,
   );

   expect(markup).toContain(`id="recent-learning-heading">${heading}</h2>`);
   expect(markup).toContain(`>${resume}<svg`);
   expect(markup).toContain(`>${grammar}</span>`);
   expect(markup).not.toContain("Common.library.");
   expect(markup).not.toContain("Home.modules.");
  },
 );
});
