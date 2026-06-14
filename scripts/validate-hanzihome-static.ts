import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const schemaModulePath = "../src/features/hanzihome/static-json/schemas/vocab.schema.ts";
const lessonSchemaModulePath =
 "../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts";

type StaticDatasetExpectation = {
 id: string;
 dir: string;
 filePrefix: string;
 expectedLessonCount: number;
 expectedLessonDocumentCount: number;
};

const datasets: StaticDatasetExpectation[] = [
 {
  id: "q2",
  dir: "data/hanzihome/q2",
  filePrefix: "hanyu_2_",
  expectedLessonCount: 25,
  expectedLessonDocumentCount: 25,
 },
 {
  id: "q3",
  dir: "data/hanzihome/q3",
  filePrefix: "hanyu_3_",
  expectedLessonCount: 26,
  expectedLessonDocumentCount: 26,
 },
];

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function validateDataset(dataset: StaticDatasetExpectation) {
 const { DeepVocabularyLessonSchema } = await import(schemaModulePath);
 const { HanyuLessonSchema } = await import(lessonSchemaModulePath);
 const { getHanyuLessonIndex } = await import(
  new URL("../src/features/hanzihome/static-json/hanyu-lesson-meta.ts", import.meta.url).href
 );
 const vocabDir = path.join(process.cwd(), dataset.dir, "vocab");
 const lessonDir = path.join(process.cwd(), dataset.dir, "lessons");
 const manifestPath = path.join(process.cwd(), dataset.dir, "manifest.json");
 const vocabFiles = (await readdir(vocabDir))
  .filter((file) => file.endsWith(".json") && file.startsWith(dataset.filePrefix))
  .sort();
 const lessonFiles = (await readdir(lessonDir))
  .filter((file) => file.endsWith(".json") && file.startsWith(dataset.filePrefix))
  .sort();
 const vocabLessons = await Promise.all(
  vocabFiles.map(async (file) =>
   DeepVocabularyLessonSchema.parse(await readJson(path.join(vocabDir, file))),
  ),
 );
 const lessonDocuments = await Promise.all(
  lessonFiles.map(async (file) =>
   HanyuLessonSchema.parse(await readJson(path.join(lessonDir, file))),
  ),
 );
 const manifest = (await readJson(manifestPath)) as {
  counts?: { lessons?: number; vocab?: number; lessonDocuments?: number };
  lessons?: Array<{
   lessonNumber: number;
   id: string;
   titleZh: string;
   vocabCount: number;
  }>;
 };
 const lessonIndexes = new Set([
  ...vocabLessons.map((lesson) => lesson.source.lesson_index),
  ...lessonDocuments.map(getHanyuLessonIndex),
 ]);
 const totalVocab = vocabLessons.reduce((sum, lesson) => sum + lesson.items.length, 0);

 if (lessonIndexes.size !== dataset.expectedLessonCount) {
  throw new Error(
   `${dataset.id}: expected ${dataset.expectedLessonCount} lessons, found ${lessonIndexes.size}`,
  );
 }

 if (lessonDocuments.length !== dataset.expectedLessonDocumentCount) {
  throw new Error(
   `${dataset.id}: expected ${dataset.expectedLessonDocumentCount} lesson documents, found ${lessonDocuments.length}`,
  );
 }

 if (
  manifest.counts?.lessons !== dataset.expectedLessonCount ||
  manifest.counts?.vocab !== totalVocab ||
  manifest.counts?.lessonDocuments !== dataset.expectedLessonDocumentCount ||
  manifest.lessons?.length !== dataset.expectedLessonCount
 ) {
  throw new Error(`${dataset.id}: manifest counts do not match dataset`);
 }

 return {
  id: dataset.id,
  lessons: lessonIndexes.size,
  vocab: totalVocab,
  lessonDocuments: lessonDocuments.length,
  firstLesson: manifest.lessons?.at(0)?.titleZh,
  lastLesson: manifest.lessons?.at(-1)?.titleZh,
 };
}

async function main() {
 const results = await Promise.all(datasets.map(validateDataset));

 console.log(JSON.stringify({ ok: true, datasets: results }, null, 2));
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
