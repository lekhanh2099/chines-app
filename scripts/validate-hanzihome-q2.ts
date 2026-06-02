import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const vocabDir = path.join(process.cwd(), "data/hanzihome/q2/vocab");
const lessonDir = path.join(process.cwd(), "data/hanzihome/q2/lessons");
const manifestPath = path.join(process.cwd(), "data/hanzihome/q2/manifest.json");
const expectedLessonCount = 25;
const expectedVocabCount = 1195;
const vocabSchemaModulePath =
 "../src/features/hanzihome/static-json/schemas/vocab.schema.ts";
const lessonSchemaModulePath =
 "../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts";

async function main() {
 const { DeepVocabularyLessonSchema } = await import(vocabSchemaModulePath);
 const { HanyuLessonSchema } = await import(lessonSchemaModulePath);
 const vocabFiles = (await readdir(vocabDir))
  .filter((file) => file.endsWith("_deep_vocab.json"))
  .sort();
 const lessonFiles = (await readdir(lessonDir))
  .filter((file) => file.endsWith(".json"))
  .sort();

 if (vocabFiles.length !== expectedLessonCount) {
  throw new Error(`Expected ${expectedLessonCount} Q2 vocab files, found ${vocabFiles.length}`);
 }

 if (lessonFiles.length !== expectedLessonCount) {
  throw new Error(`Expected ${expectedLessonCount} Q2 lesson files, found ${lessonFiles.length}`);
 }

 const vocabLessons = await Promise.all(
  vocabFiles.map(async (file) => {
   const raw = JSON.parse(await readFile(path.join(vocabDir, file), "utf8")) as unknown;
   return DeepVocabularyLessonSchema.parse(raw);
  }),
 );
 const lessonDocuments = await Promise.all(
  lessonFiles.map(async (file) => {
   const raw = JSON.parse(await readFile(path.join(lessonDir, file), "utf8")) as unknown;
   return {
    file,
    id: file.replace(/\.json$/, ""),
    document: HanyuLessonSchema.parse(raw),
   };
  }),
 );
 const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
  counts?: { lessons?: number; vocab?: number };
  lessons?: Array<{
   lessonNumber: number;
   id: string;
   titleZh: string;
   vocabCount: number;
  }>;
 };
 const lessonIndexes = lessonDocuments.map((lesson) => lesson.document.source.lesson_index);
 const missingIndexes = Array.from({ length: expectedLessonCount }, (_, index) => index + 1).filter(
  (lessonIndex) => !lessonIndexes.includes(lessonIndex),
 );
 const vocabCountByLessonIndex = new Map(
  vocabLessons.map((lesson) => [lesson.source.lesson_index, lesson.items.length] as const),
 );
 const totalVocab = vocabLessons.reduce((sum, lesson) => sum + lesson.items.length, 0);

 if (missingIndexes.length > 0) {
  throw new Error(`Missing Q2 lessons: ${missingIndexes.join(", ")}`);
 }

 if (totalVocab !== expectedVocabCount) {
  throw new Error(`Expected ${expectedVocabCount} vocab items, found ${totalVocab}`);
 }

 if (
  manifest.counts?.lessons !== expectedLessonCount ||
  manifest.counts?.vocab !== expectedVocabCount ||
  manifest.lessons?.length !== expectedLessonCount
 ) {
  throw new Error("Q2 manifest counts do not match expected lesson/vocab totals");
 }

 for (const lesson of lessonDocuments) {
  const lessonIndex = lesson.document.source.lesson_index;
  const manifestLesson = manifest.lessons.find(
   (entry) => entry.lessonNumber === lessonIndex,
  );
  const vocabCount = vocabCountByLessonIndex.get(lessonIndex) ?? 0;

  if (!manifestLesson) {
   throw new Error(`Manifest is missing lesson ${lessonIndex}`);
  }

  if (
   manifestLesson.id !== lesson.id ||
   manifestLesson.titleZh !== lesson.document.source.lesson_title_cn ||
   manifestLesson.vocabCount !== vocabCount
  ) {
   throw new Error(`Manifest mismatch for lesson ${lessonIndex}`);
  }
 }

 console.log(
  JSON.stringify(
   {
    ok: true,
    lessons: lessonDocuments.length,
    vocab: totalVocab,
    firstLesson: lessonDocuments[0]?.document.source.lesson_title_cn,
    lastLesson: lessonDocuments.at(-1)?.document.source.lesson_title_cn,
   },
   null,
   2,
  ),
 );
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
