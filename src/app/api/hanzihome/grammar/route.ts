import { NextResponse } from "next/server";
import { z } from "zod";

import { getStaticAggregateGrammarFallback } from "@/features/hanzihome/aggregate-static";
import { createHanziHomeGrammarPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(value: string | null) {
 if (value === null || value.trim() === "") return 1000;

 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1000;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1000);
}

const lessonRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
});

function jsonError(message: string, status: number) {
 return NextResponse.json({ error: message }, { status });
}

function nullableText(value: string | undefined) {
 const trimmed = value?.trim() ?? "";
 return trimmed || null;
}

function sectionKey(value: string, index: number) {
 const trimmed = value.trim();
 return trimmed || `section-${index + 1}`;
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const limit = parseLimit(url.searchParams.get("limit"));

 const items = getStaticAggregateGrammarFallback({
  courseId: url.searchParams.get("courseId"),
  bookId: url.searchParams.get("bookId"),
  lessonId: url.searchParams.get("lessonId"),
  q: url.searchParams.get("q"),
  limit,
 });

 return NextResponse.json(
  {
   items,
   debug: {
    source: "static-bundle-grammar",
    limit,
    count: items.length,
   },
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}

export async function POST(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json().catch(() => null);
 const parsed = createHanziHomeGrammarPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HanziHome grammar payload",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 const payload = parsed.data;
 const { data: lessonRow, error: lessonError } = await supabase
  .from("hanzihome_lessons")
  .select("id, course_id, book_id")
  .eq("id", payload.lessonId)
  .maybeSingle();

 if (lessonError) {
  return jsonError("Could not load lesson", 500);
 }

 const lesson = lessonRowSchema.nullable().parse(lessonRow);

 if (!lesson) {
  return jsonError("Lesson not found", 404);
 }

 const { count, error: countError } = await supabase
  .from("hanzihome_grammar_points")
  .select("id", { count: "exact", head: true })
  .eq("lesson_id", lesson.id);

 if (countError) {
  return jsonError("Could not count grammar points", 500);
 }

 const pointId = `${lesson.id}-custom-grammar-${crypto.randomUUID()}`;
 const now = new Date().toISOString();
 const { error: insertPointError } = await supabase
  .from("hanzihome_grammar_points")
  .insert({
   id: pointId,
   lesson_id: lesson.id,
   course_id: lesson.course_id,
   book_id: lesson.book_id,
   owner_id: user.id,
   source: "custom",
   point_order: (count ?? 0) + 1,
   title: payload.title,
   clean_title: payload.cleanTitle,
   core: payload.core,
   content_md: nullableText(payload.contentMd),
   structures_view: payload.structuresView,
   notes: payload.notes,
   updated_at: now,
  });

 if (insertPointError) {
  return jsonError("Could not create grammar point", 403);
 }

 const exampleRows = payload.examplesParsed.map((example, index) => ({
  id: `${pointId}-example-${index + 1}`,
  grammar_point_id: pointId,
  lesson_id: lesson.id,
  owner_id: user.id,
  source: "custom",
  example_order: index + 1,
  zh: example.zh,
  pinyin: nullableText(example.pinyin),
  vi: nullableText(example.vi),
  note: nullableText(example.note),
  updated_at: now,
 }));
 const sectionRows = payload.detailSections.map((section, index) => ({
  id: `${pointId}-section-${sectionKey(section.key, index)}`,
  grammar_point_id: pointId,
  lesson_id: lesson.id,
  owner_id: user.id,
  source: "custom",
  section_key: sectionKey(section.key, index),
  title: section.title,
  lines: section.lines,
  section_order: index + 1,
  updated_at: now,
 }));

 if (exampleRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_grammar_examples")
   .insert(exampleRows);

  if (error) {
   return jsonError("Could not create grammar examples", 403);
  }
 }

 if (sectionRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_grammar_detail_sections")
   .insert(sectionRows);

  if (error) {
   return jsonError("Could not create grammar detail sections", 403);
  }
 }

 return NextResponse.json({ ok: true, lessonId: lesson.id, pointId });
}
