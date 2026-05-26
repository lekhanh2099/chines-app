import { NextResponse } from "next/server";
import { z } from "zod";

import { getHanziHomeLessonDetail } from "@/features/hanzihome/static-data";
import { getDbHanziHomeLessonDetail } from "@/features/hanzihome/db-data";
import {
  isPostgresUniqueViolation,
  toLessonDraft,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { seedLessonDetailToLessonDraftContent } from "@/features/hanzihome/lesson-drafts/seed-lesson-to-draft";
import { createClient } from "@/lib/supabase/server";

const draftSelect =
  "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at";

const createSeedDraftRequestSchema = z.object({
  lessonId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = createSeedDraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid seed lesson draft payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const lessonId = parsed.data.lessonId;
  const lessonKey = `seed-copy-${lessonId}`;

  const existingDraftResult = await supabase
    .from("hanzihome_lesson_drafts")
    .select(draftSelect)
    .eq("user_id", user.id)
    .eq("lesson_key", lessonKey)
    .maybeSingle();

  if (existingDraftResult.error) {
    return NextResponse.json(
      { error: "Could not load existing lesson draft" },
      { status: 500 },
    );
  }

  if (existingDraftResult.data) {
    if (existingDraftResult.data.status === "archived") {
      const { data, error } = await supabase
        .from("hanzihome_lesson_drafts")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDraftResult.data.id)
        .eq("user_id", user.id)
        .select(draftSelect)
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Could not reopen existing lesson draft" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        draft: toLessonDraft(data),
        reused: true,
      });
    }

    return NextResponse.json({
      draft: toLessonDraft(existingDraftResult.data),
      reused: true,
    });
  }

  const lesson =
    (await getDbHanziHomeLessonDetail(lessonId)) ||
    getHanziHomeLessonDetail(lessonId);

  if (!lesson) {
    return NextResponse.json(
      { error: "Seed lesson not found" },
      { status: 404 },
    );
  }

  const content = seedLessonDetailToLessonDraftContent({
    lesson,
    lessonKey,
  });

  const { data, error } = await supabase
    .from("hanzihome_lesson_drafts")
    .insert({
      user_id: user.id,
      lesson_key: lessonKey,
      status: "draft",
      title_zh: lesson.titleZh,
      title_vi: lesson.title,
      lesson_number: lesson.lessonNumber,
      content,
      updated_at: new Date().toISOString(),
    })
    .select(draftSelect)
    .single();

  if (error) {
    if (isPostgresUniqueViolation(error)) {
      const duplicateDraftResult = await supabase
        .from("hanzihome_lesson_drafts")
        .select(draftSelect)
        .eq("user_id", user.id)
        .eq("lesson_key", lessonKey)
        .maybeSingle();

      if (duplicateDraftResult.data) {
        return NextResponse.json({
          draft: toLessonDraft(duplicateDraftResult.data),
          reused: true,
        });
      }
    }

    return NextResponse.json(
      { error: "Could not create seed lesson draft" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { draft: toLessonDraft(data), reused: false },
    { status: 201 },
  );
}
