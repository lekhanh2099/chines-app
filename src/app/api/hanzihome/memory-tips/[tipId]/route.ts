import { NextResponse } from "next/server";

import { mapMemoryTipRow } from "@/features/hanzihome/memory-tips/memory-tip.mapper";
import {
  updateMemoryTipPayloadSchema,
  type UpdateMemoryTipPayload,
} from "@/features/hanzihome/memory-tips/memory-tip.schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    tipId: string;
  }>;
};

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function isMissingMemoryTipsTable(code: string | undefined) {
  return code === "42P01" || code === "PGRST205";
}

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function buildUpdatePatch(payload: UpdateMemoryTipPayload) {
  const patch: {
    tip_type?: UpdateMemoryTipPayload["tipType"];
    title?: string;
    body?: string;
    formula?: string | null;
    example_zh?: string | null;
    example_pinyin?: string | null;
    example_vi?: string | null;
    source_type?: UpdateMemoryTipPayload["sourceType"];
    source_lesson_id?: string | null;
    source_item_id?: string | null;
    source_label?: string | null;
    tags?: string[];
    weight?: number;
    is_pinned?: boolean;
    is_archived?: boolean;
  } = {};

  if (payload.tipType !== undefined) patch.tip_type = payload.tipType;
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.body !== undefined) patch.body = payload.body;
  if (payload.formula !== undefined) patch.formula = nullableText(payload.formula);
  if (payload.exampleZh !== undefined) patch.example_zh = nullableText(payload.exampleZh);
  if (payload.examplePinyin !== undefined) {
    patch.example_pinyin = nullableText(payload.examplePinyin);
  }
  if (payload.exampleVi !== undefined) patch.example_vi = nullableText(payload.exampleVi);
  if (payload.sourceType !== undefined) patch.source_type = payload.sourceType;
  if (payload.sourceLessonId !== undefined) {
    patch.source_lesson_id = nullableText(payload.sourceLessonId);
  }
  if (payload.sourceItemId !== undefined) {
    patch.source_item_id = nullableText(payload.sourceItemId);
  }
  if (payload.sourceLabel !== undefined) {
    patch.source_label = nullableText(payload.sourceLabel);
  }
  if (payload.tags !== undefined) patch.tags = payload.tags;
  if (payload.weight !== undefined) patch.weight = payload.weight;
  if (payload.isPinned !== undefined) patch.is_pinned = payload.isPinned;
  if (payload.isArchived !== undefined) patch.is_archived = payload.isArchived;

  return patch;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { tipId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateMemoryTipPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid memory tip payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.sourceType === "system") {
    return jsonError("User memory tips cannot use system source", 400);
  }

  const { data, error } = await supabase
    .from("hanzihome_memory_tips")
    .update(buildUpdatePatch(parsed.data))
    .eq("id", tipId)
    .eq("owner_id", user.id)
    .eq("scope", "user")
    .neq("source_type", "system")
    .select(
      "id, owner_id, scope, tip_type, title, body, formula, example_zh, example_pinyin, example_vi, source_type, source_lesson_id, source_item_id, source_label, tags, weight, is_pinned, is_archived, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    if (isMissingMemoryTipsTable(error.code)) {
      return jsonError("Memory tips table is not ready", 503, error.code);
    }

    if (error.code === "23505") {
      return jsonError("Memory tip already exists", 409, error.code);
    }

    return jsonError("Could not update memory tip", 500, error.code);
  }

  if (!data) {
    return jsonError("Memory tip not found", 404);
  }

  return NextResponse.json({ item: mapMemoryTipRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { tipId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { error } = await supabase
    .from("hanzihome_memory_tips")
    .delete()
    .eq("id", tipId)
    .eq("owner_id", user.id)
    .eq("scope", "user")
    .neq("source_type", "system");

  if (error) {
    if (isMissingMemoryTipsTable(error.code)) {
      return jsonError("Memory tips table is not ready", 503, error.code);
    }

    return jsonError("Could not delete memory tip", 500, error.code);
  }

  return NextResponse.json({ ok: true });
}
