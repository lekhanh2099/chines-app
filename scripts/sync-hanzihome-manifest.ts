import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type DatasetConfig = {
 id: "q2" | "q3";
 title: string;
 description: string;
 filePrefix: string;
 books: Array<{
  id: string;
  title: string;
  lessonRange: [number, number];
 }>;
};

const datasets: DatasetConfig[] = [
 {
  id: "q2",
  title: "Giáo trình Hán ngữ Quyển 2",
  description: "Static JSON source-of-truth for HanziHome Q2 exam review",
  filePrefix: "hanyu_2_",
  books: [
   { id: "hanyu-q2-shang", title: "Giáo trình Hán ngữ 2 Thượng", lessonRange: [1, 12] },
   { id: "hanyu-q2-xia", title: "Giáo trình Hán ngữ 2 Hạ", lessonRange: [13, 25] },
  ],
 },
 {
  id: "q3",
  title: "Giáo trình Hán ngữ Quyển 3",
  description: "Static JSON source-of-truth for HanziHome Q3 exam review",
  filePrefix: "hanyu_3_",
  books: [
   { id: "hanyu-q3-shang", title: "Giáo trình Hán ngữ 3 Thượng", lessonRange: [1, 12] },
   { id: "hanyu-q3-xia", title: "Giáo trình Hán ngữ 3 Hạ", lessonRange: [13, 26] },
  ],
 },
];

async function readJson(filePath: string): Promise<unknown> {
 return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

function getBookId(dataset: DatasetConfig, lessonNumber: number) {
 return (
  dataset.books.find(
   (book) => lessonNumber >= book.lessonRange[0] && lessonNumber <= book.lessonRange[1],
  )?.id ||
  dataset.books[0]?.id ||
  ""
 );
}

async function syncDataset(dataset: DatasetConfig) {
 const { getHanyuLessonIndex, getHanyuLessonMeta } = await import(
  new URL("../src/features/hanzihome/static-json/hanyu-lesson-meta.ts", import.meta.url).href
 );
 const { HanyuLessonSchema } = await import(
  new URL("../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts", import.meta.url)
   .href
 );
 const { DeepVocabularyLessonSchema } = await import(
  new URL("../src/features/hanzihome/static-json/schemas/vocab.schema.ts", import.meta.url).href
 );
 const datasetDir = path.join(process.cwd(), "data/hanzihome", dataset.id);
 const vocabDir = path.join(datasetDir, "vocab");
 const lessonDir = path.join(datasetDir, "lessons");
 const manifestPath = path.join(datasetDir, "manifest.json");
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
 const vocabCountByLesson = new Map(
  vocabLessons.map((lesson) => [lesson.source.lesson_index, lesson.items.length]),
 );
 const lessonNumbers = Array.from(
  new Set([
   ...vocabLessons.map((lesson) => lesson.source.lesson_index),
   ...lessonDocuments.map(getHanyuLessonIndex),
  ]),
 ).sort((a, b) => a - b);
 const lessonDocumentByIndex = new Map(
  lessonDocuments.map((document) => [getHanyuLessonIndex(document), document]),
 );
 const vocabDocumentByIndex = new Map(
  vocabLessons.map((document) => [document.source.lesson_index, document]),
 );
 const lessons = lessonNumbers.map((lessonNumber) => {
  const lessonDocument = lessonDocumentByIndex.get(lessonNumber);
  const vocabDocument = vocabDocumentByIndex.get(lessonNumber);
  const lessonMeta = lessonDocument ? getHanyuLessonMeta(lessonDocument) : null;

  return {
   lessonNumber,
   id: lessonDocument?.lesson.id || vocabDocument?.lesson.id || "",
   bookId: getBookId(dataset, lessonNumber),
   titleZh: lessonMeta?.titleZh || vocabDocument?.lesson.title.zh || `Bài ${lessonNumber}`,
   titleVi: lessonMeta?.titleVi || vocabDocument?.lesson.title.vi || "",
   vocabCount: vocabCountByLesson.get(lessonNumber) ?? 0,
   hasLessonDocument: Boolean(lessonDocument),
  };
 });
 const manifest = {
  schemaVersion: "hanzihome-static-manifest-v1",
  course: {
   id: `hanyu-${dataset.id}`,
   title: dataset.title,
   description: dataset.description,
   books: dataset.books,
  },
  books: dataset.books,
  counts: {
   lessons: lessonNumbers.length,
   vocab: vocabLessons.reduce((sum, lesson) => sum + lesson.items.length, 0),
   lessonDocuments: lessonDocuments.length,
  },
  lessons,
 };

 await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
 return {
  id: dataset.id,
  lessons: manifest.counts.lessons,
  vocab: manifest.counts.vocab,
  lessonDocuments: manifest.counts.lessonDocuments,
 };
}

async function main() {
 const results = await Promise.all(datasets.map(syncDataset));
 console.log(JSON.stringify({ ok: true, datasets: results }, null, 2));
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
