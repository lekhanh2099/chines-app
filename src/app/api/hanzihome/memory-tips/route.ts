import { NextResponse } from "next/server";

import { mapMemoryTipRow, mapMemoryTipRows } from "@/features/hanzihome/memory-tips/memory-tip.mapper";
import { createMemoryTipPayloadSchema } from "@/features/hanzihome/memory-tips/memory-tip.schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function parseLimit(value: string | null) {
  if (!value) return 200;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 200;

  return Math.min(Math.max(Math.trunc(parsed), 1), 200);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const { data, error } = await supabase
    .from("hanzihome_memory_tips")
    .select(
      "id, owner_id, scope, tip_type, title, body, formula, example_zh, example_pinyin, example_vi, source_type, source_lesson_id, source_item_id, source_label, tags, weight, is_pinned, is_archived, created_at, updated_at",
    )
    .eq("owner_id", user.id)
    .eq("scope", "user")
    .neq("source_type", "system")
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("weight", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingMemoryTipsTable(error.code)) {
      return NextResponse.json(
        { items: [] },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return jsonError("Could not load memory tips", 500, error.code);
  }

  return NextResponse.json(
    { items: mapMemoryTipRows(data ?? []) },
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
  const parsed = createMemoryTipPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid memory tip payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  if (payload.sourceType === "system") {
    return jsonError("User memory tips cannot use system source", 400);
  }

  const { data, error } = await supabase
    .from("hanzihome_memory_tips")
    .insert({
      owner_id: user.id,
      scope: "user",
      tip_type: payload.tipType,
      title: payload.title,
      body: payload.body,
      formula: nullableText(payload.formula),
      example_zh: nullableText(payload.exampleZh),
      example_pinyin: nullableText(payload.examplePinyin),
      example_vi: nullableText(payload.exampleVi),
      source_type: payload.sourceType,
      source_lesson_id: nullableText(payload.sourceLessonId),
      source_item_id: nullableText(payload.sourceItemId),
      source_label: nullableText(payload.sourceLabel),
      tags: payload.tags,
      weight: payload.weight,
      is_pinned: payload.isPinned,
    })
    .select(
      "id, owner_id, scope, tip_type, title, body, formula, example_zh, example_pinyin, example_vi, source_type, source_lesson_id, source_item_id, source_label, tags, weight, is_pinned, is_archived, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isMissingMemoryTipsTable(error.code)) {
      return jsonError("Memory tips table is not ready", 503, error.code);
    }

    if (error.code === "23505") {
      return jsonError("Memory tip already exists", 409, error.code);
    }

    return jsonError("Could not create memory tip", 500, error.code);
  }

  return NextResponse.json({ item: mapMemoryTipRow(data) }, { status: 201 });
}
