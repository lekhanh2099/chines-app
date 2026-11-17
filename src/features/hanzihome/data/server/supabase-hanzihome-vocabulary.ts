import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type {
 AggregateFilters,
 AggregateVocabItem,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import { convertedCourseLesson } from "@/features/hanzihome/static-json/course-legacy-routes";
import { vocabCoreRowSchema } from "./supabase-content-row.schemas";
import { requireRows } from "./supabase-hanzihome-content-queries";
import { matchesTextQuery } from "./supabase-hanzihome-content-utils";

const revisionRowsSchema = z.array(z.object({ updated_at: z.string() }));

/**
 * A cheap fingerprint of everything `getAggregateItems({ kind: "vocab" })` reads:
 * it changes whenever a vocabulary row is added, edited or removed.
 */
export async function getAggregateVocabRevision(): Promise<string> {
 const client = await createClient();
 const result = await client
  .from("hanzihome_vocab_items")
  .select("updated_at", { count: "exact" })
  .order("updated_at", { ascending: false })
  .limit(1);
 if (result.error) {
  throw new Error(`HanziHome Supabase vocabulary revision failed: ${result.error.message}`);
 }
 const [latest] = revisionRowsSchema.parse(result.data);
 return `${result.count ?? 0}@${latest?.updated_at ?? ""}`;
}

/**
 * Course vocabulary rows of the vocabulary store. The lesson of a row is the
 * converted course lesson that replaced its database lesson; a row whose lesson
 * was not converted has no lesson to show and is left out.
 */
export async function getAggregateItems({
 filters,
}: {
 kind: "vocab";
 filters: AggregateFilters;
}): Promise<AggregateVocabItem[]> {
 const client = await createClient();
 const pageSize = 1_000;
 const loadPage = (page: number) => {
  let query = client
   .from("hanzihome_vocab_items")
   .select(
    "id,word_id,lesson_id,course_id,book_id,item_order,word,pinyin,han_viet,meaning,meaning_en,category,level,pos_vi,pos_zh,tone,tags,updated_at",
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
 const rowsSchema = z.array(vocabCoreRowSchema);
 const firstRows = await requireRows("aggregate vocab", Promise.resolve(first), rowsSchema);
 const pageCount = Math.ceil((first.count ?? firstRows.length) / pageSize);
 const laterRows = await Promise.all(
  Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
   requireRows("aggregate vocab", loadPage(index + 1), rowsSchema),
  ),
 );
 return [firstRows, ...laterRows]
  .flat()
  .flatMap((row): AggregateVocabItem[] => {
   const lesson = convertedCourseLesson(row.lesson_id);
   if (!lesson) return [];
   return [
    {
     id: `${row.lesson_id}__${row.id}`,
     wordId: row.word_id,
     courseId: row.course_id,
     bookId: row.book_id,
     lessonId: row.lesson_id,
     lessonNumber: lesson.number,
     lessonOrder: lesson.number,
     lessonTitle: lesson.title,
     word: row.word,
     pinyin: row.pinyin,
     hanViet: row.han_viet,
     meaning: row.meaning,
     category: row.category,
     level: row.level,
     pos: { vi: row.pos_vi, zh: row.pos_zh },
    },
   ];
  })
  .filter((item) =>
   matchesTextQuery(
    [item.word, item.pinyin, item.hanViet, item.meaning, item.category, item.lessonTitle],
    filters.q,
   ),
  );
}
