import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { attachLessonVocabularyResource } from "@/features/hanzihome/repositories/hanzihome-content-resources";

import businessChineseSeed from "./business-chinese.json";
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

 it("exposes the complete Business Chinese static corpus", () => {
  const catalog = getStaticStudioCourseCatalog("hanzihome-business-chinese");

  expect(catalog).toMatchObject({
   course: {
    id: "hanzihome-business-chinese",
    stats: { bookCount: 2, lessonCount: 20, vocabCount: 393, grammarCount: 0 },
   },
  });
  expect(catalog?.books.map((book) => book.shortTitle)).toEqual(["Quyển 2", "Quyển 3"]);
  expect(
   catalog?.books.map(
    (book) => catalog.lessons.filter((lesson) => lesson.bookId === book.id).length,
   ),
  ).toEqual([10, 10]);
  expect(
   catalog?.books.map((book) =>
    catalog.lessons
     .filter((lesson) => lesson.bookId === book.id)
     .reduce((total, lesson) => total + (lesson.vocabCount ?? 0), 0),
   ),
  ).toEqual([167, 226]);
  expect(catalog?.lessons[0]).toMatchObject({
   id: "business-chinese-tm2-lesson-01",
   titleZh: "订购真丝面料",
  });
  expect(
   catalog?.lessons.find((lesson) => lesson.id === "business-chinese-tm3-lesson-01"),
  ).toMatchObject({
   id: "business-chinese-tm3-lesson-01",
   titleZh: "开户汇款",
  });
 });

 it("hydrates canonical Business Chinese vocabulary into empty source sections", () => {
  const staticLesson = getStaticStudioLessonDetail("business-chinese-tm2-lesson-01");
  if (!staticLesson) throw new Error("Expected Business Chinese lesson 1.");

  const hydratedLesson = attachLessonVocabularyResource(staticLesson, {
   lessonId: staticLesson.id,
   items: staticLesson.vocab,
   total: staticLesson.vocab.length,
  });
  const vocabularySection = hydratedLesson.sourceLesson?.lesson.sections.find(
   (section) => section.type === "vocabulary",
  );

  expect(staticLesson.sourceLesson?.lesson.sections).toEqual(
   expect.arrayContaining([expect.objectContaining({ type: "vocabulary", items: [] })]),
  );
  expect(vocabularySection).toMatchObject({ type: "vocabulary" });
  expect(vocabularySection?.type === "vocabulary" ? vocabularySection.items : []).toHaveLength(21);
 });

 it("keeps Business Chinese lesson text and Vietnamese translations in their canonical fields", () => {
  const lesson = getStaticStudioLessonDetail("business-chinese-tm2-lesson-02");
  const textSection = lesson?.sourceLesson?.lesson.sections.find(
   (section) => section.type === "text",
  );
  if (!textSection || textSection.type !== "text") {
   throw new Error("Expected the representative Business Chinese text section.");
  }
  const block = textSection.blocks[0];
  if (!block || block.type !== "text_narrative") {
   throw new Error("Expected the representative Business Chinese narrative block.");
  }
  const paragraph = block.paragraphs.find((item) => item.zh.startsWith("郑秘书： 您好"));

  expect(block.title_vi).toBe("Mời ngài tham dự Hội nghị giới thiệu sản phẩm");
  expect(paragraph).toMatchObject({
   zh: "郑秘书： 您好！请问您是陈经理吗？",
   vi: "Trịnh thư ký: Xin chào! Cho tôi hỏi có phải là Giám đốc Trần không ạ?",
  });
  expect(paragraph?.zh).not.toContain("Trịnh thư ký");
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

 it("omits generated chatter and the post-course progress appendix", () => {
  const serialized = JSON.stringify(businessChineseSeed);

  expect(serialized).not.toContain("Vậy là tôi đã xuất");
  expect(serialized).not.toContain("BẢNG TIẾN ĐỘ");
  expect(serialized).not.toContain("TỔNG KẾT TOÀN BỘ QUYỂN 3");
  expect(serialized).not.toMatch(/"prompt":"[^"]*(?:→|=>)/);
  expect(serialized).toContain("我们是否可以参观一下贵厂？");
  expect(
   businessChineseSeed.canonical.lessonSections.every(
    (section) =>
     section.payload.type !== "vocabulary" ||
     (Array.isArray(section.payload.items) && section.payload.items.length === 0),
   ),
  ).toBe(true);
 });
});
