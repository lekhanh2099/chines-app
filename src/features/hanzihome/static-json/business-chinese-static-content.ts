import { z } from "zod";

import businessChineseSeed from "./business-chinese.json";

const businessChineseBlockSchema = z.object({
 id: z.string().min(1),
 type: z.enum(["paragraph", "subheading", "table"]),
 text: z.string(),
 rows: z.array(z.array(z.string())),
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

const businessChineseCorpus = businessChineseCorpusSchema.parse(businessChineseSeed);

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
 return businessChineseCorpus.books.map((book) => ({
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
 const book = businessChineseCorpus.books.find((item) => item.key === bookKey);
 return book?.lessons.find((lesson) => lesson.number === lessonNumber) ?? null;
}

export function getBusinessChineseCorpus() {
 return businessChineseCorpus;
}
