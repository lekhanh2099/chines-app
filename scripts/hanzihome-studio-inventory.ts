import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const jsonValueSchema = z.json();
type JsonValue = z.output<typeof jsonValueSchema>;

const paragraphSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 roleVi: z.string(),
});

const vocabularySchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 hanzi: z.string().min(1),
 pinyin: z.string(),
 meaningVi: z.string(),
 meaningInContextVi: z.string(),
 category: z.string(),
 categoryVi: z.string(),
 level: z.string(),
});

const exerciseOptionSchema = z.strictObject({
 key: z.string().min(1),
 textZh: z.string(),
 textVi: z.string(),
});

const exerciseItemSchema = z
 .strictObject({
  id: z.string().min(1),
  type: z.enum([
   "note",
   "multiple_choice",
   "true_false",
   "short_answer",
   "answer_review",
   "fill_blank",
   "discussion",
  ]),
  promptZh: z.string(),
  promptVi: z.string(),
  pinyin: z.string(),
  options: z.array(exerciseOptionSchema),
  answer: z.string(),
  answerZh: z.string(),
  answerVi: z.string(),
  scoring: z.enum(["none", "auto", "manual", "review"]),
  answerSource: z.string().min(1),
  explanationVi: z.string(),
 })
 .superRefine((item, context) => {
  if (item.type === "multiple_choice" && (item.options.length < 2 || item.answer.length === 0)) {
   context.addIssue({
    code: "custom",
    path: ["options"],
    message: "Multiple-choice items need options and an answer.",
   });
  }
  if (
   item.type === "true_false" &&
   item.answer !== "" &&
   item.answer !== "True" &&
   item.answer !== "False"
  ) {
   context.addIssue({
    code: "custom",
    path: ["answer"],
    message: "True/false items need a True or False answer.",
   });
  }
  if (item.type === "short_answer" && (item.answerZh.length === 0 || item.answerVi.length === 0)) {
   context.addIssue({
    code: "custom",
    path: ["answerZh"],
    message: "Short-answer items need Chinese and Vietnamese references.",
   });
  }
  if (item.type === "fill_blank" && item.answerZh.length === 0) {
   context.addIssue({
    code: "custom",
    path: ["answerZh"],
    message: "Fill-blank items need a Chinese answer.",
   });
  }
  const expectedScoring = {
   note: "none",
   multiple_choice: "auto",
   true_false: item.answer.length === 0 ? "manual" : "auto",
   short_answer: "manual",
   answer_review: "review",
   fill_blank: "auto",
   discussion: "manual",
  }[item.type];
  if (item.scoring !== expectedScoring) {
   context.addIssue({
    code: "custom",
    path: ["scoring"],
    message: `Unexpected scoring mode for ${item.type}.`,
   });
  }
 });

const exerciseGroupSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 type: z.enum([
  "notes",
  "vocabulary_review",
  "true_false",
  "multiple_choice",
  "short_answer",
  "fill_blank",
  "discussion",
  "mock_questions",
 ]),
 titleZh: z.string(),
 titleVi: z.string(),
 items: z.array(exerciseItemSchema).min(1),
});

const readingLessonSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
 unitId: z.string().min(1).optional(),
 kind: z.enum(["core", "mock"]).optional(),
 titleZh: z.string().min(1),
 paragraphs: z.array(paragraphSchema).min(1),
 vocabulary: z.array(vocabularySchema),
 exerciseGroups: z.array(exerciseGroupSchema),
});

const reinforcementLessonSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
});

export const readingCourseSchema = z.object({
 units: z.array(z.object({ id: z.string().min(1) })),
 coreLessons: z.array(readingLessonSchema),
 mockLessons: z.array(readingLessonSchema),
 reinforcementLessons: z.array(reinforcementLessonSchema),
});

const idListSchema = z.object({
 id: z.string().min(1),
});

const hskReadingSchema = z.object({ passages: z.array(idListSchema) });
const grammarDatasetSchema = z.object({ items: z.array(idListSchema) });
const dailyReadingSchema = z.object({
 id: z.string().min(1),
 paragraphs: z.array(z.json()),
 vocabulary: z.array(z.json()),
 grammarPoints: z.array(z.json()),
 questions: z.array(z.json()),
});
const dictationCourseSchema = z.object({
 books: z.array(
  z.object({
   id: z.string().min(1),
   volumes: z.array(
    z.object({
     id: z.string().min(1),
     lessons: z.array(
      z.object({
       id: z.string().min(1),
       segments: z.array(idListSchema),
      }),
     ),
    }),
   ),
  }),
 ),
});

const humanitiesCourseSchema = z.object({ id: z.string().min(1), version: z.string().min(1) });
const humanitiesItemSchema = z.object({
 id: z.string().min(1),
 rights: z.object({
  redistributionAllowed: z.boolean(),
 }),
});

const personalCurriculumSchema = z.object({
 schemaVersion: z.number().int(),
 lessons: z.array(idListSchema),
});
const exerciseBankSchema = z.object({
 schemaVersion: z.number().int(),
 knowledgeNodeId: z.string().min(1),
 exercises: z.array(idListSchema),
});
const pronunciationCorpusSchema = z.object({
 schemaVersion: z.string().min(1),
 cases: z.array(z.json()),
});

export const studioLessonMappingSchema = z.record(z.string().min(1), z.string().min(1));
export type StudioLessonMapping = z.output<typeof studioLessonMappingSchema>;

export type ReadingInventory = {
 coreLessons: number;
 mockLessons: number;
 reinforcementLessons: number;
 paragraphs: number;
 vocabulary: number;
 exerciseGroups: number;
 exerciseItems: number;
};

export type StudioInventory = {
 root: string;
 reading: ReadingInventory;
 hskReadingPassages: number;
 hskGrammarItems: number;
 dictationBooks: number;
 dictationLessons: number;
 dictationSegments: number;
 humanitiesItems: number;
 personalLessons: number;
 personalExercises: number;
 dailyReading: {
  paragraphs: number;
  vocabulary: number;
  grammarPoints: number;
  questions: number;
 };
 pronunciationRegressionCases: number;
 assets: Array<{ path: string; sha256: string; bytes: number }>;
};

export const studioInventoryBaseline = {
 reading: {
  coreLessons: 12,
  mockLessons: 12,
  reinforcementLessons: 24,
  paragraphs: 101,
  vocabulary: 343,
  exerciseGroups: 69,
  exerciseItems: 291,
 },
 hskReadingPassages: 50,
 hskGrammarItems: 577,
 dictationBooks: 2,
 dictationLessons: 76,
 dictationSegments: 497,
 humanitiesItems: 45,
 personalLessons: 26,
 personalExercises: 400,
 dailyReading: { paragraphs: 5, vocabulary: 11, grammarPoints: 4, questions: 5 },
 pronunciationRegressionCases: 2,
} satisfies Omit<StudioInventory, "root" | "assets">;

export function assertStudioInventoryBaseline(inventory: StudioInventory) {
 const expected = JSON.stringify(studioInventoryBaseline);
 const actual = JSON.stringify({
  reading: inventory.reading,
  hskReadingPassages: inventory.hskReadingPassages,
  hskGrammarItems: inventory.hskGrammarItems,
  dictationBooks: inventory.dictationBooks,
  dictationLessons: inventory.dictationLessons,
  dictationSegments: inventory.dictationSegments,
  humanitiesItems: inventory.humanitiesItems,
  personalLessons: inventory.personalLessons,
  personalExercises: inventory.personalExercises,
  dailyReading: inventory.dailyReading,
  pronunciationRegressionCases: inventory.pronunciationRegressionCases,
 });
 if (actual !== expected) {
  throw new Error(`Studio inventory baseline changed. Expected ${expected}, received ${actual}.`);
 }
 const expectedAssets = [
  {
   path: "hanyu-series-reading-book-1.pdf",
   sha256: "4ca2efb91e3b4da59b248d729cb8f85d58547852502a231c2d25d16dd393889e",
   bytes: 9_245_871,
  },
  {
   path: "hanyu-series-reading-book-2.pdf",
   sha256: "3969233c53ba1c15903aacdc3bf9feebdaa9acaec6572f0c788a4803b8472bef",
   bytes: 23_275_655,
  },
 ];
 const actualAssets = inventory.assets.map((asset) => ({
  path: asset.path.split("/").at(-1),
  sha256: asset.sha256,
  bytes: asset.bytes,
 }));
 if (JSON.stringify(actualAssets) !== JSON.stringify(expectedAssets)) {
  throw new Error(
   `Studio PDF asset baseline changed. Expected ${JSON.stringify(expectedAssets)}, received ${JSON.stringify(actualAssets)}.`,
  );
 }
}

export type StudioImportPreview = {
 sourceRoot: string;
 sourceChecksum: string;
 documents: Array<{
  sourceId: string;
  lessonId: string | null;
  slug: string;
  kind: "core" | "mock" | "reinforcement";
  paragraphIds: string[];
  vocabularyIds: string[];
  exerciseGroupIds: string[];
  unresolvedReferences: string[];
 }>;
 inventory: StudioInventory;
 excludedDatasets: ["dictionary", "radicals", "polyphonic"];
};

async function readJson(path: string): Promise<JsonValue> {
 return jsonValueSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

export function summarizeReadingCourse(
 course: z.output<typeof readingCourseSchema>,
): ReadingInventory {
 const studyLessons = [...course.coreLessons, ...course.mockLessons];
 return {
  coreLessons: course.coreLessons.length,
  mockLessons: course.mockLessons.length,
  reinforcementLessons: course.reinforcementLessons.length,
  paragraphs: studyLessons.reduce((total, lesson) => total + lesson.paragraphs.length, 0),
  vocabulary: studyLessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0),
  exerciseGroups: studyLessons.reduce((total, lesson) => total + lesson.exerciseGroups.length, 0),
  exerciseItems: studyLessons.reduce(
   (total, lesson) =>
    total + lesson.exerciseGroups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
   0,
  ),
 };
}

async function sha256File(path: string) {
 const content = await readFile(path);
 return {
  path,
  sha256: createHash("sha256").update(content).digest("hex"),
  bytes: content.byteLength,
 };
}

function uniqueIds(ids: string[], label: string) {
 const unique = new Set(ids);
 if (unique.size !== ids.length) {
  throw new Error(`${label} contains duplicate stable IDs.`);
 }
}

function validatePositiveOrdering(values: number[], label: string) {
 const expected = values.map((_, index) => index + 1);
 if (values.some((value, index) => value !== expected[index])) {
  throw new Error(`${label} must use contiguous one-based ordering.`);
 }
}

function validateReadingReferences(course: z.output<typeof readingCourseSchema>) {
 const unitIds = new Set(course.units.map((unit) => unit.id));
 const lessons = [...course.coreLessons, ...course.mockLessons];
 for (const lesson of lessons) {
  if (lesson.unitId !== undefined && !unitIds.has(lesson.unitId)) {
   throw new Error(`Reading lesson ${lesson.id} references a missing unit ${lesson.unitId}.`);
  }
  validatePositiveOrdering(
   lesson.paragraphs.map((paragraph) => paragraph.order),
   `${lesson.id} paragraphs`,
  );
  validatePositiveOrdering(
   lesson.vocabulary.map((item) => item.order),
   `${lesson.id} vocabulary`,
  );
  validatePositiveOrdering(
   lesson.exerciseGroups.map((group) => group.order),
   `${lesson.id} exercise groups`,
  );
  uniqueIds(
   lesson.paragraphs.map((paragraph) => paragraph.id),
   `${lesson.id} paragraphs`,
  );
  uniqueIds(
   lesson.vocabulary.map((item) => item.id),
   `${lesson.id} vocabulary`,
  );
  uniqueIds(
   lesson.exerciseGroups.map((group) => group.id),
   `${lesson.id} exercise groups`,
  );
  for (const group of lesson.exerciseGroups)
   uniqueIds(
    group.items.map((item) => item.id),
    `${group.id} exercise items`,
   );
 }
}

async function validateHumanitiesFile(path: string) {
 const value = await readJson(path);
 if (Array.isArray(value)) {
  const items = humanitiesItemSchema.array().parse(value);
  uniqueIds(
   items.map((item) => item.id),
   path,
  );
  if (items.some((item) => !item.rights.redistributionAllowed)) {
   throw new Error(`${path} contains an item that is not marked for redistribution.`);
  }
  return items.length;
 }
 humanitiesCourseSchema.parse(value);
 return 0;
}

export async function loadStudioInventory(studioRoot: string): Promise<StudioInventory> {
 const readingCourse = readingCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/data/reading-course.json")),
 );
 const reading = summarizeReadingCourse(readingCourse);
 validateReadingReferences(readingCourse);
 uniqueIds(
  [
   ...readingCourse.coreLessons,
   ...readingCourse.mockLessons,
   ...readingCourse.reinforcementLessons,
  ].map((lesson) => lesson.id),
  "reading lessons",
 );

 const hskReading = hskReadingSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json")),
 );
 uniqueIds(
  hskReading.passages.map((passage) => passage.id),
  "HSK reading passages",
 );

 let hskGrammarItems = 0;
 for (const level of [1, 2, 3, 4, 5, 6]) {
  const dataset = grammarDatasetSchema.parse(
   await readJson(join(studioRoot, `src/features/reading/grammar/data/hsk${level}.json`)),
  );
  uniqueIds(
   dataset.items.map((item) => item.id),
   `HSK ${level} grammar items`,
  );
  hskGrammarItems += dataset.items.length;
 }

 const dictation = dictationCourseSchema.parse(
  await readJson(
   join(studioRoot, "src/features/practice-lab/dictation/data/hsk-dictation-course.json"),
  ),
 );
 const dictationLessons = dictation.books.flatMap((book) =>
  book.volumes.flatMap((volume) => volume.lessons),
 );
 uniqueIds(
  dictationLessons.map((lesson) => lesson.id),
  "dictation lessons",
 );

 const dailyReading = dailyReadingSchema.parse(
  await readJson(studioRoot + "/src/features/daily-reading/data/daily-reading-seed.json"),
 );
 const pronunciationCorpus = pronunciationCorpusSchema.parse(
  await readJson(
   join(studioRoot, "src/features/contextual-pronunciation/data/curated-regression-corpus.json"),
  ),
 );
 const personalCurriculum = personalCurriculumSchema.parse(
  await readJson(
   join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
  ),
 );

 let personalExercises = 0;
 for (const file of await readdir(
  join(studioRoot, "src/features/personal-learning/data/exercise-banks"),
 )) {
  if (!file.endsWith(".json")) continue;
  const bank = exerciseBankSchema.parse(
   await readJson(join(studioRoot, "src/features/personal-learning/data/exercise-banks", file)),
  );
  uniqueIds(
   bank.exercises.map((exercise) => exercise.id),
   `personal exercise bank ${file}`,
  );
  personalExercises += bank.exercises.length;
 }

 const humanitiesFiles = ["history", "interpreting", "poetry", "translation"];
 const humanitiesItems = (
  await Promise.all(
   humanitiesFiles.map((file) =>
    validateHumanitiesFile(join(studioRoot, `src/features/humanities/data/${file}.json`)),
   ),
  )
 ).reduce((total, count) => total + count, 0);
 humanitiesCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/humanities/data/course.json")),
 );

 const resourceDirectory = join(studioRoot, "public/resources");
 const assets = await Promise.all(
  (await readdir(resourceDirectory))
   .filter((file) => file.endsWith(".pdf"))
   .sort()
   .map((file) => sha256File(join(resourceDirectory, file))),
 );

 return {
  root: studioRoot,
  reading,
  hskReadingPassages: hskReading.passages.length,
  hskGrammarItems,
  dictationBooks: dictation.books.length,
  dictationLessons: dictationLessons.length,
  dictationSegments: dictationLessons.reduce((total, lesson) => total + lesson.segments.length, 0),
  humanitiesItems,
  personalLessons: personalCurriculum.lessons.length,
  personalExercises,
  dailyReading: {
   paragraphs: dailyReading.paragraphs.length,
   vocabulary: dailyReading.vocabulary.length,
   grammarPoints: dailyReading.grammarPoints.length,
   questions: dailyReading.questions.length,
  },
  pronunciationRegressionCases: pronunciationCorpus.cases.length,
  assets,
 };
}

export async function buildStudioImportPreview(
 studioRoot: string,
 lessonMappings: StudioLessonMapping = {},
): Promise<StudioImportPreview> {
 const inventory = await loadStudioInventory(studioRoot);
 const readingCourse = readingCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/data/reading-course.json")),
 );
 const sourceFiles = [
  join(studioRoot, "src/features/reading/data/reading-course.json"),
  join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json"),
  join(studioRoot, "src/features/practice-lab/dictation/data/hsk-dictation-course.json"),
  join(studioRoot, "src/features/daily-reading/data/daily-reading-seed.json"),
  join(studioRoot, "src/features/contextual-pronunciation/data/curated-regression-corpus.json"),
  join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
  join(studioRoot, "src/features/humanities/data/course.json"),
  ...["history", "interpreting", "poetry", "translation"].map((file) =>
   join(studioRoot, `src/features/humanities/data/${file}.json`),
  ),
  ...[1, 2, 3, 4, 5, 6].map((level) =>
   join(studioRoot, `src/features/reading/grammar/data/hsk${level}.json`),
  ),
  ...(await readdir(join(studioRoot, "src/features/personal-learning/data/exercise-banks")))
   .filter((file) => file.endsWith(".json"))
   .map((file) => join(studioRoot, "src/features/personal-learning/data/exercise-banks", file)),
  ...(await readdir(join(studioRoot, "public/resources")))
   .filter((file) => file.endsWith(".pdf"))
   .map((file) => join(studioRoot, "public/resources", file)),
 ];
 const sourceHash = createHash("sha256");
 for (const path of sourceFiles.sort()) {
  sourceHash.update(path);
  sourceHash.update(await readFile(path));
 }
 const toDocument = (lesson: z.output<typeof readingLessonSchema>, kind: "core" | "mock") => ({
  sourceId: lesson.id,
  lessonId: lessonMappings[lesson.id] ?? null,
  slug: lesson.slug,
  kind,
  paragraphIds: lesson.paragraphs.map((paragraph) => paragraph.id),
  vocabularyIds: lesson.vocabulary.map((item) => item.id),
  exerciseGroupIds: lesson.exerciseGroups.map((group) => group.id),
  unresolvedReferences:
   lessonMappings[lesson.id] === undefined
    ? ["hanzihome_lessons.id mapping is required before Supabase apply"]
    : [],
 });
 const documents = [
  ...readingCourse.coreLessons.map((lesson) => toDocument(lesson, "core")),
  ...readingCourse.mockLessons.map((lesson) => toDocument(lesson, "mock")),
 ];
 return {
  sourceRoot: studioRoot,
  sourceChecksum: sourceHash.digest("hex"),
  documents,
  inventory,
  excludedDatasets: ["dictionary", "radicals", "polyphonic"],
 };
}

function defaultStudioRoot() {
 return resolve(import.meta.dirname, "..", "..", "hanzi-studio");
}

async function main() {
 const rootFlagIndex = process.argv.indexOf("--root");
 const root = resolve(
  rootFlagIndex >= 0
   ? (process.argv[rootFlagIndex + 1] ?? defaultStudioRoot())
   : (process.env.HANZI_STUDIO_ROOT ?? defaultStudioRoot()),
 );
 const inventory = await loadStudioInventory(root);
 assertStudioInventoryBaseline(inventory);
 process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) await main();
