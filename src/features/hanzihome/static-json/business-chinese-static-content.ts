import { z } from "zod";

import businessChineseSeed from "./business-chinese.json";
import chineseBridgeSeed from "./nhip-cau.json";
import readingComprehensionSeed from "./doc-hieu.json";
import spokenChineseSeed from "./khau-ngu.json";

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

const businessChineseLessonSchema = z.object({
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

const businessChineseBookSchema = z.object({
 id: z.string().min(1),
 key: z.enum(["tm2", "tm3"]),
 label: z.string().min(1),
 sourceFile: z.string().min(1),
 lessons: z.array(businessChineseLessonSchema).length(10),
});

const businessChineseCorpusSchema = z.object({
 meta: z.object({
  title: z.string().min(1),
  version: z.number().int().positive(),
  lessonCount: z.number().int().positive(),
  vocabCount: z.number().int().positive(),
 }),
 books: z.array(businessChineseBookSchema).length(2),
});

const textbookLessonSchema = businessChineseLessonSchema.extend({
 bookKey: z.enum(["tm2", "tm3", "nhip-cau", "doc-hieu", "khau-ngu"]),
 number: z.number().int().positive(),
});

const textbookBookSchema = businessChineseBookSchema.extend({
 key: textbookLessonSchema.shape.bookKey,
 lessons: z.array(textbookLessonSchema).min(1),
});

export type TextbookBook = z.infer<typeof textbookBookSchema>;

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
 }
}

function getAllTextbookBooks(): readonly TextbookBook[] {
 return [
  ...getBusinessChineseCorpus().books,
  getChineseBridgeBook(),
  getReadingComprehensionBook(),
  getSpokenChineseBook(),
 ];
}

export type TextbookLesson = z.infer<typeof textbookLessonSchema>;

export type TextbookBookSummary = ReturnType<typeof getTextbookCatalog>[number];

export type BusinessChineseLesson = z.infer<typeof businessChineseLessonSchema>;

export type BusinessChineseLessonSummary = {
 id: string;
 bookKey: BusinessChineseLesson["bookKey"];
 number: number;
 title: string;
 vocabCount: number;
};

export type BusinessChineseBookSummary = {
 id: string;
 key: BusinessChineseLesson["bookKey"];
 label: string;
 lessons: BusinessChineseLessonSummary[];
};

export function getBusinessChineseCatalog(): BusinessChineseBookSummary[] {
 return getBusinessChineseCorpus().books.map((book) => ({
  id: book.id,
  key: book.key,
  label: book.label,
  lessons: book.lessons.map((lesson) => ({
   id: lesson.id,
   bookKey: lesson.bookKey,
   number: lesson.number,
   title: lesson.title,
   vocabCount: lesson.vocab.length,
  })),
 }));
}

export function getBusinessChineseLesson(
 bookKey: BusinessChineseLesson["bookKey"],
 lessonNumber: number,
): BusinessChineseLesson | null {
 const book = getBusinessChineseCorpus().books.find((item) => item.key === bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}

export function getTextbookCatalog() {
 return getAllTextbookBooks().map((book) => ({
  id: book.id,
  key: book.key,
  label: book.label,
  lessons: book.lessons.map((lesson) => ({
   id: lesson.id,
   bookKey: lesson.bookKey,
   number: lesson.number,
   title: lesson.title,
   vocabCount: lesson.vocab.length,
  })),
 }));
}

export function getTextbookCatalogForBookKeys(bookKeys: readonly TextbookLesson["bookKey"][]) {
 return bookKeys
  .map((key) => getBookByKey(key))
  .filter((book): book is TextbookBook => book !== null)
  .map((book) => ({
   id: book.id,
   key: book.key,
   label: book.label,
   lessons: book.lessons.map((lesson) => ({
    id: lesson.id,
    bookKey: lesson.bookKey,
    number: lesson.number,
    title: lesson.title,
    vocabCount: lesson.vocab.length,
   })),
  }));
}

export function getTextbookLesson(bookKey: TextbookLesson["bookKey"], lessonNumber: number) {
 const book = getBookByKey(bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}
