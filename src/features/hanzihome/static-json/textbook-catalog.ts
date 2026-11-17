import { z } from "zod";

import courseCatalogSeed from "./courses/catalog.json";
import textbookCatalogSeed from "./textbook-catalog.json";

/**
 * The textbook content contract and the lesson lists of every book. This module
 * is safe for the client bundle: it holds no lesson content. Lessons are read
 * on the server (`course-textbooks.server.ts`) and reach the client as route
 * props or through `/api/hanzihome/textbooks/[book]/lessons/[number]`.
 */
const businessChineseBlockSchema = z.object({
 id: z.string().min(1),
 type: z.enum(["paragraph", "subheading", "table"]),
 text: z.string(),
 rows: z.array(z.array(z.string())),
 translation: z.string().optional(),
 speaker: z.string().optional(),
 answerColumnIndexes: z.array(z.number().int().nonnegative()).optional(),
 image: z
  .object({
   src: z.string().min(1),
   alt: z.string().min(1),
   width: z.number().int().positive(),
   height: z.number().int().positive(),
  })
  .optional(),
});

const businessChineseSectionSchema = z.object({
 id: z.string().min(1),
 title: z.string().min(1),
 category: z.enum(["overview", "core", "text", "vocab", "grammar", "practice"]),
 blocks: z.array(businessChineseBlockSchema),
});

const businessChineseVocabSchema = z.object({
 id: z.string().min(1),
 hanzi: z.string().min(1),
 traditional: z.string(),
 pinyin: z.string(),
 pos: z.string(),
 hanviet: z.string(),
 meaning: z.string().min(1),
});

export const businessChineseLessonSchema = z.object({
 id: z.string().min(1),
 bookKey: z.enum(["tm2", "tm3"]),
 bookLabel: z.string().min(1),
 number: z.number().int().min(1).max(10),
 rawTitle: z.string().min(1),
 title: z.string().min(1),
 intro: z.array(z.string()),
 sections: z.array(businessChineseSectionSchema),
 vocab: z.array(businessChineseVocabSchema),
});

export const businessChineseBookSchema = z.object({
 id: z.string().min(1),
 key: z.enum(["tm2", "tm3"]),
 label: z.string().min(1),
 sourceFile: z.string().min(1),
 lessons: z.array(businessChineseLessonSchema).length(10),
});

/**
 * Books converted from the former database courses.
 */
export const courseBookKeySchema = z.enum([
 "hanyu-q2-shang",
 "hanyu-q2-xia",
 "hanyu-q3-shang",
 "hanyu-q3-xia",
 "boya-9e-advanced-1",
 "boya-9e-advanced-2",
]);
export type CourseBookKey = z.output<typeof courseBookKeySchema>;

export const textbookLessonSchema = businessChineseLessonSchema.extend({
 bookKey: z.enum([
  "tm2",
  "tm3",
  "nhip-cau",
  "doc-hieu",
  "khau-ngu",
  ...courseBookKeySchema.options,
 ]),
 number: z.number().int().positive(),
});

export const textbookBookSchema = businessChineseBookSchema.extend({
 key: textbookLessonSchema.shape.bookKey,
 lessons: z.array(textbookLessonSchema).min(1),
});

export type TextbookBook = z.infer<typeof textbookBookSchema>;

const textbookBookSummarySchema = z.object({
 id: z.string().min(1),
 key: textbookLessonSchema.shape.bookKey,
 label: z.string().min(1),
 lessons: z.array(
  z.object({
   id: z.string().min(1),
   bookKey: textbookLessonSchema.shape.bookKey,
   number: z.number().int().positive(),
   title: z.string().min(1),
   vocabCount: z.number().int().nonnegative(),
  }),
 ),
});

const _courseCatalog: z.output<typeof textbookBookSummarySchema>[][] = [];
/** The converted course books with their lesson lists (no lesson content). */
export function getCourseTextbookCatalog() {
 if (_courseCatalog.length === 0) {
  _courseCatalog.push(z.array(textbookBookSummarySchema).parse(courseCatalogSeed));
 }
 const [catalog = []] = _courseCatalog;
 return catalog;
}

const _textbookCatalog: z.output<typeof textbookBookSummarySchema>[][] = [];
/** The bundled textbooks with their lesson lists (no lesson content). */
export function getTextbookCatalog() {
 if (_textbookCatalog.length === 0) {
  _textbookCatalog.push(z.array(textbookBookSummarySchema).parse(textbookCatalogSeed));
 }
 const [catalog = []] = _textbookCatalog;
 return catalog;
}

/** Lesson lists of the given books, bundled or course, in the requested order. */
export function getTextbookCatalogForBookKeys(bookKeys: readonly TextbookLesson["bookKey"][]) {
 const catalog = [...getTextbookCatalog(), ...getCourseTextbookCatalog()];
 return bookKeys.flatMap((key) => catalog.filter((book) => book.key === key));
}

export type TextbookLesson = z.infer<typeof textbookLessonSchema>;
export type TextbookBookSummary = ReturnType<typeof getTextbookCatalog>[number];
export type BusinessChineseLesson = z.infer<typeof businessChineseLessonSchema>;
