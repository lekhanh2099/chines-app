import { NextResponse } from "next/server";

import {
  createLessonKey,
  isPostgresUniqueViolation,
  toLessonDraft,
  updateLessonDraftRequestSchema,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    draftId: string;
  }>;
};

const draftSelect =
  "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at";

export async function GET(_request: Request, context: RouteContext) {
  const { draftId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("hanzihome_lesson_drafts")
    .select(draftSelect)
    .eq("id", draftId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Could not load lesson draft" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Lesson draft not found" }, { status: 404 });
  }

  return NextResponse.json({ draft: toLessonDraft(data) });
}

export async function PUT(request: Request, context: RouteContext) {
  const { draftId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = updateLessonDraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid lesson draft payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const patch: {
    lesson_key?: string;
    status?: "draft" | "published" | "archived";
    title_zh?: string;
    title_vi?: string | null;
    lesson_number?: number;
    content?: unknown;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.lessonNumber !== undefined) {
    patch.lesson_number = parsed.data.lessonNumber;
  }

  if (parsed.data.titleZh !== undefined) {
    patch.title_zh = parsed.data.titleZh;
  }

  if (parsed.data.titleVi !== undefined) {
    patch.title_vi = parsed.data.titleVi || null;
  }

  if (parsed.data.status !== undefined) {
    patch.status = parsed.data.status;
  }

  if (parsed.data.lessonKey !== undefined) {
    patch.lesson_key = parsed.data.lessonKey;
  } else if (parsed.data.lessonNumber !== undefined) {
    patch.lesson_key = createLessonKey(parsed.data.lessonNumber);
  }

  if (parsed.data.content !== undefined) {
    patch.content = parsed.data.content;
  }

  const { data, error } = await supabase
    .from("hanzihome_lesson_drafts")
    .update(patch)
    .eq("id", draftId)
    .eq("user_id", user.id)
    .select(draftSelect)
    .maybeSingle();

  if (error) {
    if (isPostgresUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Lesson draft already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not update lesson draft" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Lesson draft not found" }, { status: 404 });
  }

  return NextResponse.json({ draft: toLessonDraft(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { draftId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("hanzihome_lesson_drafts")
    .delete()
    .eq("id", draftId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete lesson draft" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
