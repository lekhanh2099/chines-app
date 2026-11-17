import { z } from "zod";

import businessChineseSeed from "./business-chinese.json";
import chineseBridgeSeed from "./nhip-cau.json";
import readingComprehensionSeed from "./doc-hieu.json";
import spokenChineseSeed from "./khau-ngu.json";
import {
 businessChineseBookSchema,
 textbookBookSchema,
 textbookLessonSchema,
 type BusinessChineseLesson,
 type TextbookBook,
 type TextbookLesson,
} from "./textbook-catalog";

// Lesson content of the bundled textbooks. Keep this module out of the client
// bundle (it imports ~5 MB of JSON): client code uses `./textbook-catalog`.
export * from "./textbook-catalog";

const businessChineseCorpusSchema = z.object({
 meta: z.object({
  title: z.string().min(1),
  version: z.number().int().positive(),
  lessonCount: z.number().int().positive(),
  vocabCount: z.number().int().positive(),
 }),
 books: z.array(businessChineseBookSchema).length(2),
});

let _businessChineseCorpus: z.infer<typeof businessChineseCorpusSchema> | null = null;
export function getBusinessChineseCorpus() {
 if (!_businessChineseCorpus) {
  _businessChineseCorpus = businessChineseCorpusSchema.parse(businessChineseSeed);
 }
 return _businessChineseCorpus;
}

let _chineseBridgeBook: TextbookBook | null = null;
function getChineseBridgeBook(): TextbookBook {
 if (!_chineseBridgeBook) {
  _chineseBridgeBook = textbookBookSchema
   .extend({
    key: z.literal("nhip-cau"),
    lessons: z.array(textbookLessonSchema.extend({ bookKey: z.literal("nhip-cau") })).length(15),
   })
   .parse(chineseBridgeSeed);
 }
 return _chineseBridgeBook;
}

let _readingComprehensionBook: TextbookBook | null = null;
function getReadingComprehensionBook(): TextbookBook {
 if (!_readingComprehensionBook) {
  _readingComprehensionBook = textbookBookSchema
   .extend({
    key: z.literal("doc-hieu"),
    lessons: z.array(textbookLessonSchema.extend({ bookKey: z.literal("doc-hieu") })).length(18),
   })
   .parse(readingComprehensionSeed);
 }
 return _readingComprehensionBook;
}

let _spokenChineseBook: TextbookBook | null = null;
function getSpokenChineseBook(): TextbookBook {
 if (!_spokenChineseBook) {
  _spokenChineseBook = textbookBookSchema
   .extend({
    key: z.literal("khau-ngu"),
    lessons: z.array(textbookLessonSchema.extend({ bookKey: z.literal("khau-ngu") })).length(24),
   })
   .parse(spokenChineseSeed);
 }
 return _spokenChineseBook;
}

/** The bundled book for `key`; `null` for a course book, whose lessons live on the server. */
function getBookByKey(key: TextbookLesson["bookKey"]): TextbookBook | null {
 switch (key) {
  case "tm2":
  case "tm3":
   return getBusinessChineseCorpus().books.find((b) => b.key === key) ?? null;
  case "nhip-cau":
   return getChineseBridgeBook();
  case "doc-hieu":
   return getReadingComprehensionBook();
  case "khau-ngu":
   return getSpokenChineseBook();
  default:
   return null;
 }
}

export function getBusinessChineseLesson(
 bookKey: BusinessChineseLesson["bookKey"],
 lessonNumber: number,
): BusinessChineseLesson | null {
 const book = getBusinessChineseCorpus().books.find((item) => item.key === bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}

/**
 * A lesson of a bundled textbook. Course books return `null` here: use
 * `getTextbookLessonOnServer` for them.
 */
export function getTextbookLesson(bookKey: TextbookLesson["bookKey"], lessonNumber: number) {
 const book = getBookByKey(bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}
