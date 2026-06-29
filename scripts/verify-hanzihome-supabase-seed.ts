import { isDeepStrictEqual } from "node:util";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SectionSchema } from "../src/features/hanzihome/static-json/schemas/hanyuLesson.schema.ts";
import {
 buildHanziHomeSeedData,
 createHanziHomeReadClient,
 EXPECTED_SEED_COUNTS,
 fetchAllRows,
 SEED_TABLES,
 validateHanziHomeSeedData,
 type HanziHomeSeedData,
} from "./lib/hanzihome-supabase-seed.ts";

type IdSourceRow = { id: string; source: string };
type BookDbRow = IdSourceRow & { course_id: string; book_order: number };
type LessonDbRow = IdSourceRow & {
 course_id: string;
 book_id: string;
 lesson_number: number;
 lesson_order: number;
};
type LessonTextDbRow = IdSourceRow & { lesson_id: string; text_key: string };
type LessonSectionDbRow = IdSourceRow & {
 lesson_id: string;
 source_section_id: string;
 section_key: string;
 section_type: string;
 title: string;
 title_vi: string;
 section_order: number;
 payload: unknown;
 source_file: string;
};
type VocabDbRow = IdSourceRow & { lesson_id: string; item_order: number };
type VocabExampleDbRow = IdSourceRow & {
 vocab_item_id: string;
 lesson_id: string;
 example_order: number;
};
type VocabDetailDbRow = IdSourceRow & {
 vocab_item_id: string;
 lesson_id: string;
 section_order: number;
};
type GrammarDbRow = IdSourceRow & { lesson_id: string; point_order: number };
type GrammarExampleDbRow = IdSourceRow & {
 grammar_point_id: string;
 lesson_id: string;
 example_order: number;
};
type GrammarDetailDbRow = IdSourceRow & {
 grammar_point_id: string;
 lesson_id: string;
 section_order: number;
};
type RadicalDbRow = IdSourceRow & {
 radical_index: number;
 radical: string;
 name_vi: string | null;
 strokes: number | null;
 core_meaning: unknown;
 variants: unknown;
 related_components: unknown;
 recognition: string | null;
 distinguish: string[];
 groups: unknown;
};

function seedOnly<T extends IdSourceRow>(rows: T[]) {
 return rows.filter((row) => row.source === "seed");
}

function assert(condition: boolean, message: string, errors: string[]) {
 if (!condition) errors.push(message);
}

function compareIds(
 label: string,
 expectedRows: Array<{ id: string }>,
 actualRows: Array<{ id: string }>,
 errors: string[],
) {
 const expected = new Set(expectedRows.map((row) => row.id));
 const actual = new Set(actualRows.map((row) => row.id));
 const missing = [...expected].filter((id) => !actual.has(id));
 const unexpected = [...actual].filter((id) => !expected.has(id));
 if (missing.length > 0) {
  errors.push(`${label}: missing IDs ${missing.slice(0, 10).join(", ")}`);
 }
 if (unexpected.length > 0) {
  errors.push(`${label}: unexpected seed IDs ${unexpected.slice(0, 10).join(", ")}`);
 }
}

function compareOrders(params: {
 label: string;
 expectedRows: Array<{ id: string; order: number }>;
 actualRows: Array<{ id: string; order: number }>;
 errors: string[];
}) {
 const expected = new Map(params.expectedRows.map((row) => [row.id, row.order]));
 for (const row of params.actualRows) {
  const expectedOrder = expected.get(row.id);
  if (expectedOrder !== undefined && expectedOrder !== row.order) {
   params.errors.push(`${params.label}: ${row.id} order=${row.order}, expected=${expectedOrder}`);
  }
 }
}

function groupByLessonId<T extends { lesson_id: string }>(rows: T[]) {
 const grouped = new Map<string, T[]>();
 for (const row of rows) {
  const lessonRows = grouped.get(row.lesson_id) ?? [];
  lessonRows.push(row);
  grouped.set(row.lesson_id, lessonRows);
 }
 return grouped;
}

async function loadDatabase(client: SupabaseClient) {
 const courses = await fetchAllRows<IdSourceRow>(client, SEED_TABLES.courses, "id,source");
 const books = await fetchAllRows<BookDbRow>(
  client,
  SEED_TABLES.books,
  "id,source,course_id,book_order",
 );
 const lessons = await fetchAllRows<LessonDbRow>(
  client,
  SEED_TABLES.lessons,
  "id,source,course_id,book_id,lesson_number,lesson_order",
 );
 const lessonSections = await fetchAllRows<LessonSectionDbRow>(
  client,
  SEED_TABLES.lessonSections,
  "id,source,lesson_id,source_section_id,section_key,section_type,title,title_vi,section_order,payload,source_file",
 );
 const lessonTexts = await fetchAllRows<LessonTextDbRow>(
  client,
  SEED_TABLES.lessonTexts,
  "id,source,lesson_id,text_key",
 );
 const vocabItems = await fetchAllRows<VocabDbRow>(
  client,
  SEED_TABLES.vocabItems,
  "id,source,lesson_id,item_order",
 );
 const vocabExamples = await fetchAllRows<VocabExampleDbRow>(
  client,
  SEED_TABLES.vocabExamples,
  "id,source,vocab_item_id,lesson_id,example_order",
 );
 const vocabDetails = await fetchAllRows<VocabDetailDbRow>(
  client,
  SEED_TABLES.vocabDetailSections,
  "id,source,vocab_item_id,lesson_id,section_order",
 );
 const grammarPoints = await fetchAllRows<GrammarDbRow>(
  client,
  SEED_TABLES.grammarPoints,
  "id,source,lesson_id,point_order",
 );
 const grammarExamples = await fetchAllRows<GrammarExampleDbRow>(
  client,
  SEED_TABLES.grammarExamples,
  "id,source,grammar_point_id,lesson_id,example_order",
 );
 const grammarDetails = await fetchAllRows<GrammarDetailDbRow>(
  client,
  SEED_TABLES.grammarDetailSections,
  "id,source,grammar_point_id,lesson_id,section_order",
 );
 const radicals = await fetchAllRows<RadicalDbRow>(
  client,
  SEED_TABLES.radicals,
  "id,source,radical_index,radical,name_vi,strokes,core_meaning,variants,related_components,recognition,distinguish,groups",
 );

 return {
  courses: seedOnly(courses),
  books: seedOnly(books),
  lessons: seedOnly(lessons),
  lessonSections: seedOnly(lessonSections),
  lessonTexts: seedOnly(lessonTexts),
  vocabItems: seedOnly(vocabItems),
  vocabExamples: seedOnly(vocabExamples),
  vocabDetails: seedOnly(vocabDetails),
  grammarPoints: seedOnly(grammarPoints),
  grammarExamples: seedOnly(grammarExamples),
  grammarDetails: seedOnly(grammarDetails),
  radicals: seedOnly(radicals),
 };
}

function verifyParents(db: Awaited<ReturnType<typeof loadDatabase>>, errors: string[]) {
 const courseIds = new Set(db.courses.map((row) => row.id));
 const bookIds = new Set(db.books.map((row) => row.id));
 const lessonIds = new Set(db.lessons.map((row) => row.id));
 const vocabIds = new Set(db.vocabItems.map((row) => row.id));
 const grammarIds = new Set(db.grammarPoints.map((row) => row.id));

 db.books.forEach((row) => assert(courseIds.has(row.course_id), `Orphan book ${row.id}`, errors));
 db.lessons.forEach((row) => {
  assert(courseIds.has(row.course_id), `Orphan lesson course ${row.id}`, errors);
  assert(bookIds.has(row.book_id), `Orphan lesson book ${row.id}`, errors);
 });
 db.lessonTexts.forEach((row) =>
  assert(lessonIds.has(row.lesson_id), `Orphan lesson text ${row.id}`, errors),
 );
 db.lessonSections.forEach((row) =>
  assert(lessonIds.has(row.lesson_id), `Orphan lesson section ${row.id}`, errors),
 );
 db.vocabItems.forEach((row) =>
  assert(lessonIds.has(row.lesson_id), `Orphan vocab item ${row.id}`, errors),
 );
 db.vocabExamples.forEach((row) => {
  assert(vocabIds.has(row.vocab_item_id), `Orphan vocab example ${row.id}`, errors);
  assert(lessonIds.has(row.lesson_id), `Orphan vocab example lesson ${row.id}`, errors);
 });
 db.vocabDetails.forEach((row) => {
  assert(vocabIds.has(row.vocab_item_id), `Orphan vocab detail ${row.id}`, errors);
  assert(lessonIds.has(row.lesson_id), `Orphan vocab detail lesson ${row.id}`, errors);
 });
 db.grammarPoints.forEach((row) =>
  assert(lessonIds.has(row.lesson_id), `Orphan grammar point ${row.id}`, errors),
 );
 db.grammarExamples.forEach((row) => {
  assert(grammarIds.has(row.grammar_point_id), `Orphan grammar example ${row.id}`, errors);
  assert(lessonIds.has(row.lesson_id), `Orphan grammar example lesson ${row.id}`, errors);
 });
 db.grammarDetails.forEach((row) => {
  assert(grammarIds.has(row.grammar_point_id), `Orphan grammar detail ${row.id}`, errors);
  assert(lessonIds.has(row.lesson_id), `Orphan grammar detail lesson ${row.id}`, errors);
 });
}

function verifySamples(
 seed: HanziHomeSeedData,
 db: Awaited<ReturnType<typeof loadDatabase>>,
 errors: string[],
) {
 const sampleLessons = [
  seed.lessons.find((row) => row.course_id === "hanyu-q2" && row.lesson_number === 1),
  seed.lessons.find((row) => row.course_id === "hanyu-q2" && row.lesson_number === 25),
  seed.lessons.find((row) => row.course_id === "hanyu-q3" && row.lesson_number === 1),
  seed.lessons.find((row) => row.course_id === "hanyu-q3" && row.lesson_number === 5),
  seed.lessons.find((row) => row.course_id === "hanyu-q3" && row.lesson_number === 26),
 ].filter((row): row is HanziHomeSeedData["lessons"][number] => row !== undefined);
 const dbLessonIds = new Set(db.lessons.map((row) => row.id));
 const textLessonIds = new Set(db.lessonTexts.map((row) => row.lesson_id));
 const expectedSectionsByLesson = groupByLessonId(seed.lessonSections);
 const actualSectionsByLesson = groupByLessonId(db.lessonSections);

 for (const lesson of sampleLessons) {
  assert(dbLessonIds.has(lesson.id), `Sample lesson missing: ${lesson.id}`, errors);
  assert(textLessonIds.has(lesson.id), `Sample lesson has no lesson text: ${lesson.id}`, errors);
  const expectedSections = expectedSectionsByLesson.get(lesson.id) ?? [];
  const actualSections = actualSectionsByLesson.get(lesson.id) ?? [];
  assert(
   actualSections.length === expectedSections.length,
   `Sample lesson ${lesson.id} sections=${actualSections.length}, expected=${expectedSections.length}`,
   errors,
  );
 }
}

function verifySectionParity(
 seed: HanziHomeSeedData,
 db: Awaited<ReturnType<typeof loadDatabase>>,
 errors: string[],
) {
 const expectedById = new Map(seed.lessonSections.map((row) => [row.id, row]));

 for (const row of db.lessonSections) {
  const expected = expectedById.get(row.id);
  if (!expected) continue;

  const parsedPayload = SectionSchema.safeParse(row.payload);
  if (!parsedPayload.success) {
   errors.push(`Lesson section ${row.id} payload failed SectionSchema validation`);
   continue;
  }

  assert(
   row.source_section_id === expected.source_section_id,
   `Lesson section ${row.id} source_section_id mismatch`,
   errors,
  );
  assert(
   row.section_key === expected.section_key,
   `Lesson section ${row.id} section_key mismatch`,
   errors,
  );
  assert(
   row.section_type === expected.section_type,
   `Lesson section ${row.id} section_type mismatch`,
   errors,
  );
  assert(row.title === expected.title, `Lesson section ${row.id} title mismatch`, errors);
  assert(row.title_vi === expected.title_vi, `Lesson section ${row.id} title_vi mismatch`, errors);
  assert(
   row.section_order === expected.section_order,
   `Lesson section ${row.id} section_order mismatch`,
   errors,
  );
  assert(
   row.source_file === expected.source_file,
   `Lesson section ${row.id} source_file mismatch`,
   errors,
  );
  assert(
   isDeepStrictEqual(parsedPayload.data, expected.payload),
   `Lesson section ${row.id} payload differs from seed source`,
   errors,
  );
 }
}

async function main() {
 console.log("Verifying HanziHome Supabase seed...");
 const expected = await buildHanziHomeSeedData("all", "verification");
 const localValidation = validateHanziHomeSeedData(expected, "all");
 if (localValidation.errors.length > 0) {
  throw new Error(`Local seed invalid:\n${localValidation.errors.join("\n")}`);
 }

 const client = createHanziHomeReadClient();
 const db = await loadDatabase(client);
 const errors: string[] = [];

 const hardCounts = EXPECTED_SEED_COUNTS.all;
 assert(db.courses.length === 2, `courses=${db.courses.length}, expected=2`, errors);
 assert(db.books.length === 4, `books=${db.books.length}, expected=4`, errors);
 assert(
  db.lessons.length === hardCounts.lessons,
  `lessons=${db.lessons.length}, expected=${hardCounts.lessons}`,
  errors,
 );
 assert(
  db.lessonSections.length === hardCounts.lessonSections,
  `lessonSections=${db.lessonSections.length}, expected=${hardCounts.lessonSections}`,
  errors,
 );
 assert(
  db.vocabItems.length === hardCounts.vocabItems,
  `vocabItems=${db.vocabItems.length}, expected=${hardCounts.vocabItems}`,
  errors,
 );
 assert(
  db.grammarPoints.length === hardCounts.grammarPoints,
  `grammarPoints=${db.grammarPoints.length}, expected=${hardCounts.grammarPoints}`,
  errors,
 );
 assert(
  db.vocabExamples.length === hardCounts.vocabExamples,
  `vocabExamples=${db.vocabExamples.length}, expected=${hardCounts.vocabExamples}`,
  errors,
 );
 assert(
  db.grammarExamples.length === hardCounts.grammarExamples,
  `grammarExamples=${db.grammarExamples.length}, expected=${hardCounts.grammarExamples}`,
  errors,
 );
 assert(
  db.radicals.length === hardCounts.radicals,
  `radicals=${db.radicals.length}, expected=${hardCounts.radicals}`,
  errors,
 );

 compareIds("courses", expected.courses, db.courses, errors);
 compareIds("books", expected.books, db.books, errors);
 compareIds("lessons", expected.lessons, db.lessons, errors);
 compareIds("lessonSections", expected.lessonSections, db.lessonSections, errors);
 compareIds("lessonTexts", expected.lessonTexts, db.lessonTexts, errors);
 compareIds("vocabItems", expected.vocabItems, db.vocabItems, errors);
 compareIds("vocabExamples", expected.vocabExamples, db.vocabExamples, errors);
 compareIds("vocabDetailSections", expected.vocabDetailSections, db.vocabDetails, errors);
 compareIds("grammarPoints", expected.grammarPoints, db.grammarPoints, errors);
 compareIds("grammarExamples", expected.grammarExamples, db.grammarExamples, errors);
 compareIds("grammarDetailSections", expected.grammarDetailSections, db.grammarDetails, errors);
 compareIds("radicals", expected.radicals, db.radicals, errors);

 compareOrders({
  label: "lessons",
  expectedRows: expected.lessons.map((row) => ({ id: row.id, order: row.lesson_order })),
  actualRows: db.lessons.map((row) => ({ id: row.id, order: row.lesson_order })),
  errors,
 });
 compareOrders({
  label: "lessonSections",
  expectedRows: expected.lessonSections.map((row) => ({
   id: row.id,
   order: row.section_order,
  })),
  actualRows: db.lessonSections.map((row) => ({
   id: row.id,
   order: row.section_order,
  })),
  errors,
 });
 compareOrders({
  label: "vocabItems",
  expectedRows: expected.vocabItems.map((row) => ({ id: row.id, order: row.item_order })),
  actualRows: db.vocabItems.map((row) => ({ id: row.id, order: row.item_order })),
  errors,
 });
 compareOrders({
  label: "grammarPoints",
  expectedRows: expected.grammarPoints.map((row) => ({
   id: row.id,
   order: row.point_order,
  })),
  actualRows: db.grammarPoints.map((row) => ({ id: row.id, order: row.point_order })),
  errors,
 });
 compareOrders({
  label: "vocabExamples",
  expectedRows: expected.vocabExamples.map((row) => ({
   id: row.id,
   order: row.example_order,
  })),
  actualRows: db.vocabExamples.map((row) => ({
   id: row.id,
   order: row.example_order,
  })),
  errors,
 });
 compareOrders({
  label: "grammarExamples",
  expectedRows: expected.grammarExamples.map((row) => ({
   id: row.id,
   order: row.example_order,
  })),
  actualRows: db.grammarExamples.map((row) => ({
   id: row.id,
   order: row.example_order,
  })),
  errors,
 });
 compareOrders({
  label: "radicals",
  expectedRows: expected.radicals.map((row) => ({
   id: row.id,
   order: row.radical_index,
  })),
  actualRows: db.radicals.map((row) => ({
   id: row.id,
   order: row.radical_index,
  })),
  errors,
 });

 verifyParents(db, errors);
 verifySamples(expected, db, errors);
 verifySectionParity(expected, db, errors);

 console.table({
  courses: db.courses.length,
  books: db.books.length,
  lessons: db.lessons.length,
  lessonSections: db.lessonSections.length,
  lessonTexts: db.lessonTexts.length,
  vocabItems: db.vocabItems.length,
  vocabExamples: db.vocabExamples.length,
  vocabDetailSections: db.vocabDetails.length,
  grammarPoints: db.grammarPoints.length,
  grammarExamples: db.grammarExamples.length,
  grammarDetailSections: db.grammarDetails.length,
  radicals: db.radicals.length,
 });

 if (errors.length > 0) {
  console.error(errors.join("\n"));
  throw new Error(`Supabase seed verification failed with ${errors.length} error(s).`);
 }

 console.log("Supabase seed verification passed: counts, IDs, parents, order, and samples.");
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
