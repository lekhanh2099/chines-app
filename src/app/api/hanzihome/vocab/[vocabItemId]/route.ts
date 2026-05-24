import { NextResponse } from "next/server";
import { z } from "zod";

import { updateHanziHomeVocabPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    vocabItemId: string;
  }>;
};

const editableSourceSchema = z.enum(["seed", "custom"]);
const vocabItemRowSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  course_id: z.string(),
  book_id: z.string(),
  source: editableSourceSchema,
  owner_id: z.string().nullable(),
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

export async function PATCH(request: Request, context: RouteContext) {
  const { vocabItemId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateHanziHomeVocabPayloadSchema.safeParse(body);

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
  const { data: itemRow, error: itemError } = await supabase
    .from("hanzihome_vocab_items")
    .select("id, lesson_id, course_id, book_id, source, owner_id")
    .eq("id", vocabItemId)
    .maybeSingle();

  if (itemError) {
    return jsonError("Could not load vocab item", 500);
  }

  const item = vocabItemRowSchema.nullable().parse(itemRow);

  if (!item) {
    return jsonError("Vocab item not found", 404);
  }

  if (item.lesson_id !== payload.lessonId) {
    return jsonError("Vocab item does not belong to this lesson", 400);
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from("hanzihome_vocab_items")
    .update({
      owner_id: user.id,
      word: payload.word,
      pinyin: payload.pinyin,
      han_viet: payload.hanViet,
      meaning: payload.meaning,
      category: payload.category,
      level: nullableText(payload.level),
      pos_vi: nullableText(payload.pos?.vi),
      pos_zh: nullableText(payload.pos?.zh),
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return jsonError("Could not update vocab item", 403);
  }

  if (!updatedItem) {
    return jsonError("Vocab item is not editable by this user", 403);
  }

  const source = item.source;
  const childOwnerPatch = { owner_id: user.id, updated_at: new Date().toISOString() };
  const [claimExamples, claimSections] = await Promise.all([
    supabase
      .from("hanzihome_vocab_examples")
      .update(childOwnerPatch)
      .eq("vocab_item_id", item.id),
    supabase
      .from("hanzihome_vocab_detail_sections")
      .update(childOwnerPatch)
      .eq("vocab_item_id", item.id),
  ]);

  if (claimExamples.error || claimSections.error) {
    return jsonError("Could not claim vocab child rows", 403);
  }

  const [deleteExamples, deleteSections] = await Promise.all([
    supabase.from("hanzihome_vocab_examples").delete().eq("vocab_item_id", item.id),
    supabase
      .from("hanzihome_vocab_detail_sections")
      .delete()
      .eq("vocab_item_id", item.id),
  ]);

  if (deleteExamples.error || deleteSections.error) {
    return jsonError("Could not replace vocab child rows", 403);
  }

  const now = new Date().toISOString();
  const exampleRows = payload.examplesParsed.map((example, index) => ({
    id: `${item.id}-example-${index + 1}`,
    vocab_item_id: item.id,
    lesson_id: item.lesson_id,
    owner_id: user.id,
    source,
    example_order: index + 1,
    zh: example.zh,
    pinyin: nullableText(example.pinyin),
    vi: nullableText(example.vi),
    note: nullableText(example.note),
    updated_at: now,
  }));
  const sectionRows = payload.detailSections.map((section, index) => ({
    id: `${item.id}-section-${sectionKey(section.key, index)}`,
    vocab_item_id: item.id,
    lesson_id: item.lesson_id,
    owner_id: user.id,
    source,
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
      return jsonError("Could not save vocab examples", 403);
    }
  }

  if (sectionRows.length > 0) {
    const { error } = await supabase
      .from("hanzihome_vocab_detail_sections")
      .insert(sectionRows);

    if (error) {
      return jsonError("Could not save vocab detail sections", 403);
    }
  }

  return NextResponse.json({ ok: true, lessonId: item.lesson_id });
}
