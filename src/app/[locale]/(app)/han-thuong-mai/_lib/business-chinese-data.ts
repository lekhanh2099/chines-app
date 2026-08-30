import "server-only";

import { gunzipSync } from "node:zlib";
import { z } from "zod";

import contentChunk1 from "../_data/content-chunk-1";
import contentChunk2 from "../_data/content-chunk-2";
import contentChunk3 from "../_data/content-chunk-3";
import contentChunk4 from "../_data/content-chunk-4";
import contentChunk5 from "../_data/content-chunk-5";
import contentChunk6 from "../_data/content-chunk-6";

const paragraphBlockSchema = z.strictObject({
 type: z.literal("paragraph"),
 text: z.string(),
});

const subheadingBlockSchema = z.strictObject({
 type: z.literal("subheading"),
 text: z.string(),
});

const tableBlockSchema = z.strictObject({
 type: z.literal("table"),
 rows: z.array(z.array(z.string())),
});

const lessonBlockSchema = z.discriminatedUnion("type", [
 paragraphBlockSchema,
 subheadingBlockSchema,
 tableBlockSchema,
]);

const lessonSectionSchema = z.strictObject({
 title: z.string(),
 category: z.enum(["overview", "core", "text", "vocab", "grammar", "practice"]),
 blocks: z.array(lessonBlockSchema),
});

const vocabularyItemSchema = z.strictObject({
 hanzi: z.string(),
 traditional: z.string(),
 pinyin: z.string(),
 pos: z.string(),
 hanviet: z.string(),
 meaning: z.string(),
});

const lessonSchema = z.strictObject({
 key: z.string(),
 bookKey: z.enum(["tm2", "tm3"]),
 bookLabel: z.string(),
 number: z.number().int().positive(),
 rawTitle: z.string(),
 title: z.string(),
 intro: z.array(lessonBlockSchema),
 sections: z.array(lessonSectionSchema),
 vocab: z.array(vocabularyItemSchema),
});

const bookSchema = z.strictObject({
 label: z.string(),
 lessons: z.array(lessonSchema),
});

const businessChineseDataSchema = z.strictObject({
 books: z.strictObject({
  tm2: bookSchema,
  tm3: bookSchema,
 }),
 meta: z.strictObject({
  title: z.string(),
  version: z.number().int().positive(),
  lessonCount: z.number().int().nonnegative(),
  vocabCount: z.number().int().nonnegative(),
 }),
});

function loadBusinessChineseData() {
 const encoded = [
  contentChunk1,
  contentChunk2,
  contentChunk3,
  contentChunk4,
  contentChunk5,
  contentChunk6,
 ].join("");
 const json = gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
 return businessChineseDataSchema.parse(JSON.parse(json));
}

const businessChineseData = loadBusinessChineseData();

export type BusinessChineseBookKey = keyof typeof businessChineseData.books;
export type BusinessChineseLesson = z.infer<typeof lessonSchema>;
export type BusinessChineseLessonSection = z.infer<typeof lessonSectionSchema>;
export type BusinessChineseLessonBlock = z.infer<typeof lessonBlockSchema>;
export type BusinessChineseVocabularyItem = z.infer<typeof vocabularyItemSchema>;

export type BusinessChineseLessonSummary = {
 number: number;
 title: string;
 vocabularyCount: number;
};

export type BusinessChineseBookSummary = {
 key: BusinessChineseBookKey;
 label: string;
 lessonCount: number;
 vocabularyCount: number;
 lessons: BusinessChineseLessonSummary[];
};

export const businessChineseMeta = businessChineseData.meta;

export function resolveBusinessChineseBookKey(value: string | undefined): BusinessChineseBookKey {
 return value === "tm3" ? "tm3" : "tm2";
}

export function getBusinessChineseBookSummaries(): BusinessChineseBookSummary[] {
 return (["tm2", "tm3"] satisfies BusinessChineseBookKey[]).map((key) => {
  const book = businessChineseData.books[key];
  return {
   key,
   label: book.label,
   lessonCount: book.lessons.length,
   vocabularyCount: book.lessons.reduce((sum, lesson) => sum + lesson.vocab.length, 0),
   lessons: book.lessons.map((lesson) => ({
    number: lesson.number,
    title: lesson.title,
    vocabularyCount: lesson.vocab.length,
   })),
  };
 });
}

export function getBusinessChineseLesson(
 bookKey: BusinessChineseBookKey,
 lessonNumber: number,
): BusinessChineseLesson {
 const book = businessChineseData.books[bookKey];
 const lesson = book.lessons.find((candidate) => candidate.number === lessonNumber);
 if (lesson !== undefined) return lesson;
 const firstLesson = book.lessons.at(0);
 if (firstLesson === undefined) {
  throw new Error(`Business Chinese book ${bookKey} has no lessons`);
 }
 return firstLesson;
}

export function resolveBusinessChineseLessonNumber(
 bookKey: BusinessChineseBookKey,
 value: string | undefined,
): number {
 const parsed = Number.parseInt(value ?? "", 10);
 if (!Number.isFinite(parsed)) return 1;
 const book = businessChineseData.books[bookKey];
 return book.lessons.some((lesson) => lesson.number === parsed) ? parsed : 1;
}
