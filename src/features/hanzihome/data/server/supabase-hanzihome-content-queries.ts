import type { JsonFieldValue } from "@/types/json";
import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import {
 catalogStatsRowSchema,
 grammarRowSchema,
 lessonDetailRowSchema,
 lessonSectionRowSchema,
 lessonShellRowSchema,
 lessonSummaryRowSchema,
 radicalRowSchema,
 vocabRowSchema,
} from "./supabase-content-row.schemas";
import { radicalRowToViewModel } from "./supabase-hanzihome-content-utils";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
type SupabaseOperationError = z.infer<z.ZodObject<{ message: z.ZodString }>>;

export async function requireRows<T>(
 operation: string,
 promise: PromiseLike<{
  data: JsonFieldValue;
  error: Nullable<SupabaseOperationError>;
 }>,
 schema: z.ZodType<T>,
) {
 const result = await promise;
 if (result.error) {
  throw new Error(`HanziHome Supabase ${operation} failed: ${result.error.message}`);
 }
 return schema.parse(result.data);
}

export async function requirePagedRows<T>(
 operation: string,
 schema: z.ZodType<T[]>,
 loadPage: (
  from: number,
  to: number,
 ) => PromiseLike<{
  data: JsonFieldValue;
  error: Nullable<SupabaseOperationError>;
 }>,
) {
 const pageSize = 1_000;
 const rows: T[] = [];

 for (let from = 0; ; from += pageSize) {
  const page = await requireRows(operation, loadPage(from, from + pageSize - 1), schema);
  rows.push(...page);
  if (page.length < pageSize) return rows;
 }
}

export async function getRadicalsFromDatabase(): Promise<StaticRadicalData[]> {
 const client = await createClient();
 const result = await client
  .from("hanzihome_radicals")
  .select(
   "id,radical_index,radical,name_vi,strokes,core_meaning,variants,related_components,recognition,distinguish,groups,updated_at",
  )
  .eq("source", "seed")
  .is("deleted_at", null)
  .order("radical_index");

 if (result.error) {
  throw new Error(`HanziHome Supabase radicals failed: ${result.error.message}`);
 }

 const rows = z.array(radicalRowSchema).parse(result.data);
 if (rows.length === 0) {
  throw new Error("HanziHome Supabase radicals returned no seed rows.");
 }

 return rows.map(radicalRowToViewModel);
}

export async function getLessonSummaryRows(courseId?: string) {
 const client = await createClient();
 let query = client
  .from("hanzihome_lessons")
  .select(
   `
    id,
    course_id,
    book_id,
    lesson_number,
    lesson_order,
    title_zh,
    title_pinyin,
    title_vi,
    title_en,
    tags,
    source_file,
    updated_at,
    course:hanzihome_courses!inner(id,slug,title,subtitle,type,course_order,updated_at),
    book:hanzihome_course_books!inner(id,course_id,title,short_title,book_order,updated_at),
    vocab_count:hanzihome_vocab_items(count),
    grammar_count:hanzihome_grammar_points(count)
   `,
  )
  .is("deleted_at", null)
  .is("course.deleted_at", null)
  .is("book.deleted_at", null)
  .order("lesson_order");

 if (courseId) query = query.eq("course_id", courseId);
 return requireRows("lesson summaries", query, z.array(lessonSummaryRowSchema));
}

export async function getCatalogStatsRows() {
 const client = await createClient();
 return requireRows(
  "catalog stats",
  client.rpc("get_hanzihome_catalog_stats"),
  z.array(catalogStatsRowSchema),
 );
}

export async function getLessonDetailRow(lessonId: string) {
 const client = await createClient();
 const [shellRows, sections, grammar] = await Promise.all([
  requireRows(
   `lesson shell ${lessonId}`,
   client
    .from("hanzihome_lessons")
    .select(
     `
     id,
     course_id,
     book_id,
     lesson_number,
     lesson_order,
     title_zh,
     title_pinyin,
     title_vi,
     title_en,
     tags,
     source_file,
     updated_at,
     course:hanzihome_courses!inner(id,slug,title,subtitle,type,course_order,updated_at),
     book:hanzihome_course_books!inner(id,course_id,title,short_title,book_order,updated_at),
     texts:hanzihome_lesson_texts(id,lesson_id,text_key,title,content,content_format,updated_at)
    `,
    )
    .eq("id", lessonId)
    .is("deleted_at", null)
    .is("course.deleted_at", null)
    .is("book.deleted_at", null)
    .is("texts.deleted_at", null)
    .limit(1),
   z.array(lessonShellRowSchema),
  ),
  requireRows(
   `lesson sections ${lessonId}`,
   client
    .from("hanzihome_lesson_sections")
    .select(
     "id,lesson_id,source_section_id,section_key,section_type,title,title_vi,section_order,payload,source_file,updated_at",
    )
    .eq("lesson_id", lessonId)
    .is("deleted_at", null)
    .order("section_order"),
   z.array(lessonSectionRowSchema),
  ),
  requireRows(
   `lesson grammar ${lessonId}`,
   client
    .from("hanzihome_grammar_points")
    .select(
     `
     id,lesson_id,course_id,book_id,point_order,title,title_vi,clean_title,level,core,content_md,structures_view,notes,tags,updated_at,
     examples:hanzihome_grammar_examples(id,grammar_point_id,example_order,zh,pinyin,vi,note,updated_at),
     details:hanzihome_grammar_detail_sections(id,grammar_point_id,section_key,title,lines,section_order,updated_at)
     `,
    )
    .eq("lesson_id", lessonId)
    .is("deleted_at", null)
    .is("examples.deleted_at", null)
    .is("details.deleted_at", null)
    .order("point_order"),
   z.array(grammarRowSchema),
  ),
 ]);

 const shell = shellRows[0];
 return shell
  ? lessonDetailRowSchema.parse({
     ...shell,
     sections,
     vocab: [],
     grammar,
    })
  : null;
}

export async function getLessonVocabularyRows(lessonId: string) {
 const client = await createClient();
 return requireRows(
  `lesson vocabulary resource ${lessonId}`,
  client
   .from("hanzihome_vocab_items")
   .select(
    `
    id,lesson_id,course_id,book_id,item_order,word,pinyin,han_viet,meaning,meaning_en,category,level,pos_vi,pos_zh,tone,tags,updated_at,
    examples:hanzihome_vocab_examples(id,vocab_item_id,example_order,zh,pinyin,vi,note,updated_at),
    details:hanzihome_vocab_detail_sections(id,vocab_item_id,section_key,title,lines,section_order,updated_at)
    `,
   )
   .eq("lesson_id", lessonId)
   .is("deleted_at", null)
   .is("examples.deleted_at", null)
   .is("details.deleted_at", null)
   .order("item_order"),
  z.array(vocabRowSchema),
 );
}

export async function getLessonSectionRow(sectionId: string) {
 const client = await createClient();
 const rows = await requireRows(
  `lesson section ${sectionId}`,
  client
   .from("hanzihome_lesson_sections")
   .select("*")
   .eq("id", sectionId)
   .is("deleted_at", null)
   .limit(1),
  z.array(lessonSectionRowSchema),
 );
 return rows[0] ?? null;
}
