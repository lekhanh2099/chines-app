import { NextResponse } from "next/server";

import {
  buildEmptyLessonDraftContent,
  createLessonDraftRequestSchema,
  createLessonKey,
  isPostgresUniqueViolation,
  toLessonDraft,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("hanzihome_lesson_drafts")
    .select(
      "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("lesson_number", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load lesson drafts" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    drafts: (data ?? []).map(toLessonDraft),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = createLessonDraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid lesson draft payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const lessonKey =
    parsed.data.lessonKey ?? createLessonKey(parsed.data.lessonNumber);

  const content = buildEmptyLessonDraftContent({
    ...parsed.data,
    lessonKey,
  });

  const { data, error } = await supabase
    .from("hanzihome_lesson_drafts")
    .insert({
      user_id: user.id,
      lesson_key: lessonKey,
      status: "draft",
      title_zh: parsed.data.titleZh,
      title_vi: parsed.data.titleVi ?? null,
      lesson_number: parsed.data.lessonNumber,
      content,
      updated_at: new Date().toISOString(),
    })
    .select(
      "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at",
    )
    .single();

  if (error) {
    if (isPostgresUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Lesson draft already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not create lesson draft" },
      { status: 500 },
    );
  }

  return NextResponse.json({ draft: toLessonDraft(data) }, { status: 201 });
}
