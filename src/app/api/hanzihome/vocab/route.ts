import { NextResponse } from "next/server";
import { z } from "zod";

import { getStaticAggregateVocabFallback } from "@/features/hanzihome/aggregate-static";
import { createHanziHomeVocabPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(value: string | null) {
 if (value === null || value.trim() === "") return 1500;

 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1500;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1500);
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

 const items = getStaticAggregateVocabFallback({
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
    source: "static-bundle-vocab",
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
 const parsed = createHanziHomeVocabPayloadSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid HanziHome vocab payload",
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
  .from("hanzihome_vocab_items")
  .select("id", { count: "exact", head: true })
  .eq("lesson_id", lesson.id);

 if (countError) {
  return jsonError("Could not count vocab items", 500);
 }

 const itemId = `${lesson.id}-custom-vocab-${crypto.randomUUID()}`;
 const now = new Date().toISOString();
 const { error: insertItemError } = await supabase
  .from("hanzihome_vocab_items")
  .insert({
   id: itemId,
   lesson_id: lesson.id,
   course_id: lesson.course_id,
   book_id: lesson.book_id,
   owner_id: user.id,
   source: "custom",
   item_order: (count ?? 0) + 1,
   word: payload.word,
   pinyin: payload.pinyin,
   han_viet: payload.hanViet,
   meaning: payload.meaning,
   category: payload.category,
   level: nullableText(payload.level),
   pos_vi: nullableText(payload.pos?.vi),
   pos_zh: nullableText(payload.pos?.zh),
   updated_at: now,
  });

 if (insertItemError) {
  return jsonError("Could not create vocab item", 403);
 }

 const exampleRows = payload.examplesParsed.map((example, index) => ({
  id: `${itemId}-example-${index + 1}`,
  vocab_item_id: itemId,
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
  id: `${itemId}-section-${sectionKey(section.key, index)}`,
  vocab_item_id: itemId,
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
   .from("hanzihome_vocab_examples")
   .insert(exampleRows);

  if (error) {
   return jsonError("Could not create vocab examples", 403);
  }
 }

 if (sectionRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_vocab_detail_sections")
   .insert(sectionRows);

  if (error) {
   return jsonError("Could not create vocab detail sections", 403);
  }
 }

 return NextResponse.json({ ok: true, lessonId: lesson.id, itemId });
}
