import { NextResponse } from "next/server";
import { z } from "zod";

import { updateHanziHomeGrammarPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    grammarPointId: string;
  }>;
};

const editableSourceSchema = z.enum(["seed", "custom"]);
const grammarPointRowSchema = z.object({
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

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function sectionKey(value: string, index: number) {
  const trimmed = value.trim();
  return trimmed || `section-${index + 1}`;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { grammarPointId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateHanziHomeGrammarPayloadSchema.safeParse(body);

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
  const { data: pointRow, error: pointError } = await supabase
    .from("hanzihome_grammar_points")
    .select("id, lesson_id, course_id, book_id, source, owner_id")
    .eq("id", grammarPointId)
    .maybeSingle();

  if (pointError) {
    return jsonError("Could not load grammar point", 500);
  }

  const point = grammarPointRowSchema.nullable().parse(pointRow);

  if (!point) {
    return jsonError("Grammar point not found", 404);
  }

  if (point.lesson_id !== payload.lessonId) {
    return jsonError("Grammar point does not belong to this lesson", 400);
  }

  if (point.source === "seed") {
    return jsonError(
      "Seed grammar is read-only. Fork the course before editing.",
      403,
    );
  }

  if (point.owner_id !== user.id) {
    return jsonError("Grammar point is not editable by this user", 403);
  }

  const { data: updatedPoint, error: updateError } = await supabase
    .from("hanzihome_grammar_points")
    .update({
      owner_id: user.id,
      title: payload.title,
      clean_title: payload.cleanTitle,
      core: payload.core,
      content_md: nullableText(payload.contentMd),
      structures_view: payload.structuresView,
      notes: payload.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", point.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return jsonError("Could not update grammar point", 403);
  }

  if (!updatedPoint) {
    return jsonError("Grammar point is not editable by this user", 403);
  }

  const source = point.source;
  const childOwnerPatch = { owner_id: user.id, updated_at: new Date().toISOString() };
  const [claimExamples, claimSections] = await Promise.all([
    supabase
      .from("hanzihome_grammar_examples")
      .update(childOwnerPatch)
      .eq("grammar_point_id", point.id),
    supabase
      .from("hanzihome_grammar_detail_sections")
      .update(childOwnerPatch)
      .eq("grammar_point_id", point.id),
  ]);

  if (claimExamples.error || claimSections.error) {
    return jsonError("Could not claim grammar child rows", 403);
  }

  const [deleteExamples, deleteSections] = await Promise.all([
    supabase
      .from("hanzihome_grammar_examples")
      .delete()
      .eq("grammar_point_id", point.id),
    supabase
      .from("hanzihome_grammar_detail_sections")
      .delete()
      .eq("grammar_point_id", point.id),
  ]);

  if (deleteExamples.error || deleteSections.error) {
    return jsonError("Could not replace grammar child rows", 403);
  }

  const now = new Date().toISOString();
  const exampleRows = payload.examplesParsed.map((example, index) => ({
    id: `${point.id}-example-${index + 1}`,
    grammar_point_id: point.id,
    lesson_id: point.lesson_id,
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
    id: `${point.id}-section-${sectionKey(section.key, index)}`,
    grammar_point_id: point.id,
    lesson_id: point.lesson_id,
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
      .from("hanzihome_grammar_examples")
      .insert(exampleRows);

    if (error) {
      return jsonError("Could not save grammar examples", 403);
    }
  }

  if (sectionRows.length > 0) {
    const { error } = await supabase
      .from("hanzihome_grammar_detail_sections")
      .insert(sectionRows);

    if (error) {
      return jsonError("Could not save grammar detail sections", 403);
    }
  }

  return NextResponse.json({ ok: true, lessonId: point.lesson_id });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { grammarPointId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { data: pointRow, error: pointError } = await supabase
    .from("hanzihome_grammar_points")
    .select("id, lesson_id, course_id, book_id, source, owner_id")
    .eq("id", grammarPointId)
    .maybeSingle();

  if (pointError) {
    return jsonError("Could not load grammar point", 500);
  }

  const point = grammarPointRowSchema.nullable().parse(pointRow);

  if (!point) {
    return jsonError("Grammar point not found", 404);
  }

  if (point.source === "seed") {
    return jsonError(
      "Seed grammar is read-only. Fork the course before deleting.",
      403,
    );
  }

  if (point.owner_id !== user.id) {
    return jsonError("Grammar point is not editable by this user", 403);
  }

  const [deleteExamples, deleteSections] = await Promise.all([
    supabase
      .from("hanzihome_grammar_examples")
      .delete()
      .eq("grammar_point_id", point.id),
    supabase
      .from("hanzihome_grammar_detail_sections")
      .delete()
      .eq("grammar_point_id", point.id),
  ]);

  if (deleteExamples.error || deleteSections.error) {
    return jsonError("Could not delete grammar child rows", 403);
  }

  const { error: deletePointError } = await supabase
    .from("hanzihome_grammar_points")
    .delete()
    .eq("id", point.id)
    .eq("owner_id", user.id)
    .eq("source", "custom");

  if (deletePointError) {
    return jsonError("Could not delete grammar point", 403);
  }

  return NextResponse.json({ ok: true, lessonId: point.lesson_id });
}
