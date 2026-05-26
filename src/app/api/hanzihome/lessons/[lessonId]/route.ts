import { NextResponse } from "next/server";
import { z } from "zod";

import { getDbHanziHomeLessonDetail } from "@/features/hanzihome/db-data";
import { updateHanziHomeLessonPayloadSchema } from "@/features/hanzihome/hanzihome-api.schemas";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    lessonId: string;
  }>;
};

const editableSourceSchema = z.enum(["seed", "custom"]);
const lessonRowSchema = z.object({
  id: z.string(),
  source: editableSourceSchema,
  owner_id: z.string().nullable(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  const { lessonId } = await context.params;

  try {
    const lesson = await getDbHanziHomeLessonDetail(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { source: "empty", lesson: null },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { source: "db", lesson },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { source: "empty", lesson: null },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { lessonId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateHanziHomeLessonPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid HanziHome lesson payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { data: lessonRow, error: lessonError } = await supabase
    .from("hanzihome_lessons")
    .select("id, source, owner_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError) {
    return jsonError("Could not load lesson", 500);
  }

  const lesson = lessonRowSchema.nullable().parse(lessonRow);

  if (!lesson) {
    return jsonError("Lesson not found", 404);
  }

  const payload = parsed.data;
  const { data: updatedLesson, error: updateError } = await supabase
    .from("hanzihome_lessons")
    .update({
      owner_id: user.id,
      lesson_number: payload.lessonNumber,
      lesson_order: payload.lessonOrder,
      title_zh: payload.titleZh,
      title_vi: payload.titleVi?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lesson.id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    const status = updateError.code === "23505" ? 409 : 403;

    return jsonError("Could not update lesson", status);
  }

  if (!updatedLesson) {
    return jsonError("Lesson is not editable by this user", 403);
  }

  return NextResponse.json({ ok: true, lessonId: lesson.id });
}
