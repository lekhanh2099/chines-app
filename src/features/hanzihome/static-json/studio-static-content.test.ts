import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
 getStaticStudioAggregateItems,
 getStaticStudioCourseCatalog,
 getStaticStudioLessonDetail,
 getStaticStudioListeningLessonBundle,
 listStaticStudioCourseLessons,
} from "./studio-static-content";

describe("bundled Studio static content", () => {
 it("exposes dictation lesson summaries without a database", () => {
  const lessons = listStaticStudioCourseLessons("hanzihome-studio-dictation");

  expect(lessons).toHaveLength(126);
  expect(lessons[0]).toMatchObject({
   id: "hanzihome-studio-dictation:hsk5-lesson-01",
   titleZh: "爱的细节",
  });
 });

 it("builds a typed listening bundle from the reviewed JSON", () => {
  const bundle = getStaticStudioListeningLessonBundle("hanzihome-studio-dictation:hsk5-lesson-01");

  expect(bundle?.sections).toHaveLength(1);
  expect(bundle?.items).toHaveLength(8);
  expect(bundle?.items[0]).toMatchObject({
   type: "dictation",
   sectionId: bundle?.sections[0]?.id,
   transcript: { full: { zh: "电台要选出一对最恩爱的夫妻。对比后，有三对夫妻入围。" } },
  });
 });

 it("exposes HSK Reader passages as sentence-level Dictation sources", () => {
  const bundle = getStaticStudioListeningLessonBundle(
   "hanzihome-studio-dictation:hsk3-independent-passages-lesson-11-text-4",
  );

  expect(bundle?.items).toHaveLength(5);
  expect(bundle?.items.map((item) => item.transcript?.full.zh)).toEqual([
   "这个笔记本电脑我去年买的时候要五千块左右，现在便宜多了。",
   "我想把这个电脑卖了，再买一个更好的。",
   "现在我每天起床后的第一件事就是打开电脑，看电子邮件。",
   "我已经很少写信，也很少用笔写字，已经习惯用电脑来学习和工作了。",
   "哪一天突然没有了电脑，我们怎么办呢？",
  ]);
 });

 it("materializes every static lesson and dictation bundle", () => {
  for (const lesson of listStaticStudioCourseLessons("hanzihome-studio-dictation")) {
   expect(getStaticStudioLessonDetail(lesson.id)?.id).toBe(lesson.id);
   const bundle = getStaticStudioListeningLessonBundle(lesson.id);
   expect(bundle?.lesson.id).toBe(lesson.id);
   expect(bundle?.sections.length).toBeGreaterThan(0);
   expect(bundle?.items.length).toBeGreaterThan(0);
  }
 }, 30_000);

 it("exposes canonical grammar and vocabulary through HanziHome contracts", () => {
  const grammarLesson = getStaticStudioLessonDetail("hanzihome-studio-grammar:lesson:HSK1");
  const grammarItems = getStaticStudioAggregateItems({
   kind: "grammar",
   filters: {
    courseId: "hanzihome-studio-grammar",
    bookId: "",
    lessonId: "",
    q: "",
   },
  });

  expect(grammarLesson?.grammar.length).toBeGreaterThan(0);
  expect(grammarItems.length).toBe(577);
  expect(grammarItems[0]).toMatchObject({
   courseId: "hanzihome-studio-grammar",
   title: 'PHỦ ĐỊNH CỦA "有" VỚI "没"',
  });
 });

 it("exposes the bundled HSK grammar course for the course catalog", () => {
  const catalog = getStaticStudioCourseCatalog("hanzihome-studio-grammar");

  expect(catalog).toMatchObject({
   course: {
    id: "hanzihome-studio-grammar",
    stats: { bookCount: 6, lessonCount: 6, vocabCount: 0, grammarCount: 577 },
   },
  });
  expect(catalog?.books.map((book) => book.title)).toEqual([
   "HSK1",
   "HSK2",
   "HSK3",
   "HSK4",
   "HSK5",
   "HSK6",
  ]);
  expect(catalog?.lessons.map((lesson) => lesson.grammarCount)).toEqual([40, 97, 141, 161, 83, 55]);
 });

 it("keeps Business Chinese out of aggregate API resources", () => {
  const items = getStaticStudioAggregateItems({
   kind: "vocab",
   filters: {
    courseId: "hanzihome-business-chinese",
    bookId: "",
    lessonId: "",
    q: "",
   },
  });

  expect(items).toEqual([]);
 });
});
