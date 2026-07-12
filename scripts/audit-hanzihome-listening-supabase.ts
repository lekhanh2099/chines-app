import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { fetchListeningLessonBundle } from "../src/features/hanzihome/listening/listening.repository.ts";

loadEnv({ path: ".env.local" });
loadEnv();

const COURSE_ID = "hanyu-listening-revised";
const PAGE_SIZE = 500;
const BASELINE = {
 books: 2,
 lessons: 50,
 sections: 118,
 items: 693,
 vocabulary: 466,
} as const;

const lessonRowSchema = z.object({ id: z.string().min(1) });
const sectionRowSchema = z.object({
 id: z.string().uuid(),
 lesson_id: z.string().min(1),
 payload: z.record(z.string(), z.unknown()),
});
const itemRowSchema = z.object({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 section_id: z.string().uuid(),
 item_type: z.string().min(1),
 prompt_zh: z.string().nullable(),
 transcript: z.unknown().nullable(),
 options: z.array(z.unknown()),
 answer: z.record(z.string(), z.unknown()).nullable(),
 metadata: z.record(z.string(), z.unknown()),
 quality_status: z.string().min(1),
 check_needed: z.boolean(),
 quality_issues: z.array(z.string()),
});

type PageResult<T> = {
 data: T[] | null;
 error: { message: string } | null;
};

async function fetchPaged<T>(
 label: string,
 requestPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
) {
 const rows: T[] = [];
 for (let from = 0; ; from += PAGE_SIZE) {
  const result = await requestPage(from, from + PAGE_SIZE - 1);
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  const page = result.data ?? [];
  rows.push(...page);
  if (page.length < PAGE_SIZE) return rows;
 }
}

function recordArray(value: unknown) {
 return Array.isArray(value) ? value : [];
}

async function main() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) throw new Error("Missing public Supabase URL or publishable key");

 const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
 });

 const lessons = lessonRowSchema
  .array()
  .parse(
   await fetchPaged("lessons", (from, to) =>
    supabase
     .from("hanzihome_lessons")
     .select("id")
     .eq("course_id", COURSE_ID)
     .is("deleted_at", null)
     .order("lesson_order")
     .range(from, to),
   ),
  );
 const lessonIds = lessons.map((lesson) => lesson.id);

 const [sections, items, bookCountResult, vocabularyCountResult] = await Promise.all([
  fetchPaged("sections", (from, to) =>
   supabase
    .from("hanzihome_lesson_sections")
    .select("id,lesson_id,payload")
    .in("lesson_id", lessonIds)
    .eq("section_type", "listening")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("section_order")
    .range(from, to),
  ).then((rows) => sectionRowSchema.array().parse(rows)),
  fetchPaged("items", (from, to) =>
   supabase
    .from("hanzihome_listening_items")
    .select(
     "id,lesson_id,section_id,item_type,prompt_zh,transcript,options,answer,metadata,quality_status,check_needed,quality_issues",
    )
    .in("lesson_id", lessonIds)
    .eq("publication_status", "published")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("section_id")
    .order("item_order")
    .range(from, to),
  ).then((rows) => itemRowSchema.array().parse(rows)),
  supabase
   .from("hanzihome_course_books")
   .select("id", { count: "exact", head: true })
   .eq("course_id", COURSE_ID)
   .is("deleted_at", null),
  supabase
   .from("hanzihome_vocab_items")
   .select("id", { count: "exact", head: true })
   .eq("course_id", COURSE_ID)
   .is("deleted_at", null),
 ]);

 if (bookCountResult.error) throw new Error(`books: ${bookCountResult.error.message}`);
 if (vocabularyCountResult.error) {
  throw new Error(`vocabulary: ${vocabularyCountResult.error.message}`);
 }

 const errors: string[] = [];
 const warnings: string[] = [];
 const sectionById = new Map(sections.map((section) => [section.id, section]));
 const lessonIdSet = new Set(lessonIds);

 for (const section of sections) {
  if (!lessonIdSet.has(section.lesson_id)) errors.push(`Orphan section ${section.id}`);
 }
 for (const item of items) {
  const section = sectionById.get(item.section_id);
  if (!section || section.lesson_id !== item.lesson_id) errors.push(`Orphan item ${item.id}`);
 }

 const bundles = [];
 for (const lesson of lessons) {
  const bundle = await fetchListeningLessonBundle(supabase, lesson.id);
  if (!bundle) {
   errors.push(`Runtime bundle missing for ${lesson.id}`);
   continue;
  }
  bundles.push(bundle);
 }

 const noPlayableText = items.filter((item) => {
  const sectionTranscript = sectionById.get(item.section_id)?.payload.transcript;
  return !item.prompt_zh?.trim() && item.transcript === null && sectionTranscript === undefined;
 });
 if (noPlayableText.length > 0) {
  warnings.push(`${noPlayableText.length} items have options but no prompt or transcript`);
 }

 const noCheckableAnswer = items.filter(
  (item) => item.options.length >= 2 && item.answer?.type !== "choice",
 );
 if (noCheckableAnswer.length > 0) {
  warnings.push(`${noCheckableAnswer.length} choice items have no checkable answer`);
 }

 const incompleteMatching = items.filter(
  (item) =>
   item.item_type === "matching" &&
   (recordArray(item.metadata.left).length === 0 ||
    recordArray(item.metadata.right).length === 0 ||
    item.answer?.type !== "matching"),
 );
 if (incompleteMatching.length > 0) {
  warnings.push(
   `${incompleteMatching.length} source items are labelled matching but only contain short-answer data`,
  );
 }

 const reviewPending = items.filter(
  (item) => item.check_needed || item.quality_status === "needs_review",
 );
 if (reviewPending.length > 0) {
  warnings.push(`${reviewPending.length} items are still marked needs_review/check_needed`);
 }

 const counts = {
  books: bookCountResult.count ?? 0,
  lessons: lessons.length,
  sections: sections.length,
  runtimeSections: bundles.reduce((sum, bundle) => sum + bundle.sections.length, 0),
  items: items.length,
  runtimeItems: bundles.reduce((sum, bundle) => sum + bundle.items.length, 0),
  vocabulary: vocabularyCountResult.count ?? 0,
 };

 for (const key of Object.keys(BASELINE) as Array<keyof typeof BASELINE>) {
  if (counts[key] !== BASELINE[key]) {
   errors.push(`${key}: expected ${BASELINE[key]}, received ${counts[key]}`);
  }
 }
 if (counts.runtimeItems !== counts.items) {
  errors.push(`Runtime returned ${counts.runtimeItems}/${counts.items} listening items`);
 }

 const report = {
  readyForJsonRemoval: errors.length === 0,
  contentQualityReady: warnings.length === 0,
  source: "supabase-public-data-api",
  courseId: COURSE_ID,
  counts,
  errors,
  warnings,
  warningSamples: {
   noPlayableText: noPlayableText.slice(0, 10).map((item) => item.id),
   noCheckableAnswer: noCheckableAnswer.slice(0, 10).map((item) => item.id),
   incompleteMatching: incompleteMatching.slice(0, 10).map((item) => item.id),
  },
 };

 console.log(JSON.stringify(report, null, 2));
 if (!report.readyForJsonRemoval) process.exitCode = 1;
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
