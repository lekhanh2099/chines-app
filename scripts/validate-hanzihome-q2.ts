import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const vocabDir = path.join(process.cwd(), "data/hanzihome/q2/vocab");
const manifestPath = path.join(process.cwd(), "data/hanzihome/q2/manifest.json");
const expectedLessonCount = 25;
const expectedVocabCount = 1195;
const schemaModulePath =
 "../src/features/hanzihome/static-json/schemas/vocab.schema.ts";

async function main() {
 const { DeepVocabularyLessonSchema } = await import(schemaModulePath);
 const files = (await readdir(vocabDir))
  .filter((file) => file.endsWith("_deep_vocab.json"))
  .sort();

 if (files.length !== expectedLessonCount) {
  throw new Error(`Expected ${expectedLessonCount} Q2 vocab files, found ${files.length}`);
 }

 const lessons = await Promise.all(
  files.map(async (file) => {
   const raw = JSON.parse(await readFile(path.join(vocabDir, file), "utf8")) as unknown;
   return DeepVocabularyLessonSchema.parse(raw);
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
 const lessonIndexes = lessons.map((lesson) => lesson.source.lesson_index);
 const missingIndexes = Array.from({ length: expectedLessonCount }, (_, index) => index + 1).filter(
  (lessonIndex) => !lessonIndexes.includes(lessonIndex),
 );
 const totalVocab = lessons.reduce((sum, lesson) => sum + lesson.items.length, 0);

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

 for (const lesson of lessons) {
  const manifestLesson = manifest.lessons.find(
   (entry) => entry.lessonNumber === lesson.source.lesson_index,
  );

  if (!manifestLesson) {
   throw new Error(`Manifest is missing lesson ${lesson.source.lesson_index}`);
  }

  if (
   manifestLesson.id !== lesson.lesson.id ||
   manifestLesson.titleZh !== lesson.lesson.title.zh ||
   manifestLesson.vocabCount !== lesson.items.length
  ) {
   throw new Error(`Manifest mismatch for lesson ${lesson.source.lesson_index}`);
  }
 }

 console.log(
  JSON.stringify(
   {
    ok: true,
    lessons: lessons.length,
    vocab: totalVocab,
    firstLesson: lessons[0]?.lesson.title.zh,
    lastLesson: lessons.at(-1)?.lesson.title.zh,
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
