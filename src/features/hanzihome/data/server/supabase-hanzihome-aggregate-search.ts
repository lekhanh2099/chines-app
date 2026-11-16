import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { HanziHomeData } from "@/features/hanzihome/types";
import type {
 AggregateFilters,
 AggregateGrammarItem,
 AggregateKind,
 AggregateResourceItem,
 AggregateVocabItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import {
 aggregateGrammarRowSchema,
 aggregateVocabRowSchema,
 grammarCoreRowSchema,
 lessonDetailRowSchema,
 lessonSectionRowSchema,
 lessonTextRowSchema,
 vocabCoreRowSchema,
} from "./supabase-content-row.schemas";
import {
 getLessonSummaryRows,
 getRadicalsFromDatabase,
 requirePagedRows,
 requireRows,
} from "./supabase-hanzihome-content-queries";
import { buildMeta, groupBy, matchesTextQuery } from "./supabase-hanzihome-content-utils";
import { lessonDetailToViewModel } from "./supabase-hanzihome-lesson-model";

const revisionRowsSchema = z.array(z.object({ updated_at: z.string() }));

/**
 * A cheap fingerprint of everything `getAggregateItems({ kind: "vocab" })` reads:
 * it changes whenever a vocabulary row or a lesson is added, edited or removed.
 */
export async function getAggregateVocabRevision(): Promise<string> {
 const client = await createClient();
 const [vocabulary, lessons] = await Promise.all([
  client
   .from("hanzihome_vocab_items")
   .select("updated_at", { count: "exact" })
   .order("updated_at", { ascending: false })
   .limit(1),
  client
   .from("hanzihome_lessons")
   .select("updated_at", { count: "exact" })
   .order("updated_at", { ascending: false })
   .limit(1),
 ]);
 return [vocabulary, lessons]
  .map((result) => {
   if (result.error) {
    throw new Error(`HanziHome Supabase vocabulary revision failed: ${result.error.message}`);
   }
   const [latest] = revisionRowsSchema.parse(result.data);
   return `${result.count ?? 0}@${latest?.updated_at ?? ""}`;
  })
  .join("|");
}

export async function getAggregateItems({
 kind,
 filters,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
}): Promise<AggregateResourceItem[]> {
 const client = await createClient();

 if (kind === "vocab") {
  const pageSize = 1_000;
  const loadPage = (page: number) => {
   let query = client
    .from("hanzihome_vocab_items")
    .select(
     `
      id,word_id,lesson_id,course_id,book_id,item_order,word,pinyin,han_viet,meaning,meaning_en,category,level,pos_vi,pos_zh,tone,tags,updated_at,
      lesson:hanzihome_lessons!inner(id,lesson_number,lesson_order,title_zh,title_vi)
     `,
     { count: "exact" },
    )
    .order("lesson_id")
    .order("item_order")
    .range(page * pageSize, (page + 1) * pageSize - 1);
   if (filters.courseId) query = query.eq("course_id", filters.courseId);
   if (filters.bookId) query = query.eq("book_id", filters.bookId);
   if (filters.lessonId) query = query.eq("lesson_id", filters.lessonId);
   return query;
  };
  // The first page reports the total, so the remaining pages load together.
  const first = await loadPage(0);
  const rowsSchema = z.array(aggregateVocabRowSchema);
  const firstRows = await requireRows("aggregate vocab", Promise.resolve(first), rowsSchema);
  const pageCount = Math.ceil((first.count ?? firstRows.length) / pageSize);
  const laterRows = await Promise.all(
   Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
    requireRows("aggregate vocab", loadPage(index + 1), rowsSchema),
   ),
  );
  const rows = [firstRows, ...laterRows].flat();
  return rows
   .map((row): AggregateVocabItem => ({
    id: `${row.lesson_id}__${row.id}`,
    wordId: row.word_id,
    courseId: row.course_id,
    bookId: row.book_id,
    lessonId: row.lesson_id,
    lessonNumber: row.lesson.lesson_number,
    lessonOrder: row.lesson.lesson_order,
    lessonTitle: row.lesson.title_zh || row.lesson.title_vi || "",
    word: row.word,
    pinyin: row.pinyin,
    hanViet: row.han_viet,
    meaning: row.meaning,
    category: row.category,
    level: row.level,
    pos: { vi: row.pos_vi, zh: row.pos_zh },
   }))
   .filter((item) =>
    matchesTextQuery(
     [item.word, item.pinyin, item.hanViet, item.meaning, item.category, item.lessonTitle],
     filters.q,
    ),
   );
 }

 const rows = await requirePagedRows(
  "aggregate grammar",
  z.array(aggregateGrammarRowSchema),
  (from, to) => {
   let query = client
    .from("hanzihome_grammar_points")
    .select(
     `
      *,
      lesson:hanzihome_lessons!inner(*)
     `,
    )
    .order("lesson_id")
    .order("point_order")
    .range(from, to);
   if (filters.courseId) query = query.eq("course_id", filters.courseId);
   if (filters.bookId) query = query.eq("book_id", filters.bookId);
   if (filters.lessonId) query = query.eq("lesson_id", filters.lessonId);
   return query;
  },
 );
 return rows
  .map((row): AggregateGrammarItem => ({
   id: `${row.lesson_id}__${row.id}`,
   courseId: row.course_id,
   bookId: row.book_id,
   lessonId: row.lesson_id,
   lessonNumber: row.lesson.lesson_number,
   lessonOrder: row.lesson.lesson_order,
   lessonTitle: row.lesson.title_zh || row.lesson.title_vi || "",
   title: row.title,
   cleanTitle: row.clean_title,
   core: row.core,
  }))
  .filter((item) =>
   matchesTextQuery([item.title, item.cleanTitle, item.core, item.lessonTitle], filters.q),
  );
}

// RLS lets editors read soft-deleted rows, so learner-facing reads filter
// deleted_at explicitly instead of relying on the policy.
export async function getSearchData(): Promise<HanziHomeData> {
 const summaries = await getLessonSummaryRows();
 const client = await createClient();
 const [sections, texts, vocab, grammar, radicals] = await Promise.all([
  requirePagedRows("search lesson sections", z.array(lessonSectionRowSchema), (from, to) =>
   client
    .from("hanzihome_lesson_sections")
    .select("*")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("section_order")
    .range(from, to),
  ),
  requirePagedRows("search lesson texts", z.array(lessonTextRowSchema), (from, to) =>
   client
    .from("hanzihome_lesson_texts")
    .select("*")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("text_key")
    .range(from, to),
  ),
  requirePagedRows("search vocab", z.array(vocabCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_vocab_items")
    .select("*")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("item_order")
    .range(from, to),
  ),
  requirePagedRows("search grammar", z.array(grammarCoreRowSchema), (from, to) =>
   client
    .from("hanzihome_grammar_points")
    .select("*")
    .is("deleted_at", null)
    .order("lesson_id")
    .order("point_order")
    .range(from, to),
  ),
  getRadicalsFromDatabase(),
 ]);
 const sectionsByLesson = groupBy(sections, (row) => row.lesson_id);
 const textsByLesson = groupBy(texts, (row) => row.lesson_id);
 const vocabByLesson = groupBy(vocab, (row) => row.lesson_id);
 const grammarByLesson = groupBy(grammar, (row) => row.lesson_id);
 const lessons = summaries.map((summary) => {
  const detail = lessonDetailRowSchema.parse({
   ...summary,
   sections: sectionsByLesson.get(summary.id) ?? [],
   texts: textsByLesson.get(summary.id) ?? [],
   vocab: (vocabByLesson.get(summary.id) ?? []).map((item) => ({
    ...item,
    examples: [],
    details: [],
   })),
   grammar: (grammarByLesson.get(summary.id) ?? []).map((item) => ({
    ...item,
    examples: [],
    details: [],
   })),
  });
  return lessonDetailToViewModel(detail);
 });

 return {
  courses: Array.from(
   new Map(
    summaries.map((row) => [
     row.course.id,
     {
      id: row.course.id,
      slug: row.course.slug,
      title: row.course.title,
      subtitle: row.course.subtitle ?? undefined,
      type: row.course.type,
      order: row.course.course_order,
      updatedAt: row.course.updated_at,
     },
    ]),
   ).values(),
  ),
  books: Array.from(
   new Map(
    summaries.map((row) => [
     row.book.id,
     {
      id: row.book.id,
      courseId: row.book.course_id,
      title: row.book.title,
      shortTitle: row.book.short_title ?? undefined,
      order: row.book.book_order,
      updatedAt: row.book.updated_at,
     },
    ]),
   ).values(),
  ),
  lessons,
  radicals,
  meta: buildMeta(lessons, radicals),
 };
}
