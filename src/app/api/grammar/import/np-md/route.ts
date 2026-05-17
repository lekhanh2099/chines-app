import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingGrammarTableError, parseHanyuGrammarMarkdown } from "@/services/grammar-learning.service";
import type { DbGrammarCourse } from "@/types/database";

export const dynamic = "force-dynamic";

const DEFAULT_NP_PATH = "/Users/hagenlee/Downloads/Np.md";

function migrationRequired(message?: string) {
 return NextResponse.json(
  {
   error: "Database grammar schema chưa được apply. Chạy migration supabase/migrations/20260312000016_grammar_learning.sql trước.",
   details: message,
   migrationRequired: true,
  },
  { status: 409 },
 );
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 try {
  const body = (await request.json().catch(() => ({}))) as { text?: string; preview?: boolean; reset?: boolean };
  const text = body.text?.trim() || (await readFile(DEFAULT_NP_PATH, "utf8"));
  const parsed = parseHanyuGrammarMarkdown(text, "preview-course");
  if (!parsed.length) return NextResponse.json({ error: "Không parse được bài nào từ Np.md" }, { status: 400 });

  if (body.preview) {
   return NextResponse.json({
    lessons: parsed.map((lesson) => ({
     lesson_key: lesson.lesson_key,
     lesson_number: lesson.lesson_number,
     title: lesson.title,
     points: lesson.points.length,
    })),
    totalLessons: parsed.length,
    totalPoints: parsed.reduce((sum, lesson) => sum + lesson.points.length, 0),
   });
  }

  const { data: existing, error: existingError } = await supabase
   .from("grammar_courses")
   .select("*")
   .eq("owner_id", user.id)
   .eq("course_key", "hanyu-2-grammar")
   .maybeSingle();
  if (isMissingGrammarTableError(existingError)) return migrationRequired(existingError?.message);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  let course = existing as DbGrammarCourse | null;
  if (course && body.reset !== false) {
   const { error: deleteError } = await supabase.from("grammar_courses").delete().eq("id", course.id);
   if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
   course = null;
  }

  if (!course) {
   const { data, error } = await supabase
    .from("grammar_courses")
    .insert({
     owner_id: user.id,
     course_key: "hanyu-2-grammar",
     title: "Hán ngữ 2 - Ngữ pháp",
     source_type: "markdown",
     source_file: "Np.md",
    })
    .select("*")
    .single();
   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
   course = data as DbGrammarCourse;
  }

  let importedLessons = 0;
  let importedPoints = 0;
  for (const lesson of parsed) {
   const { data: insertedLesson, error: lessonError } = await supabase
    .from("grammar_lessons")
    .upsert(
     {
      course_id: course.id,
      lesson_key: lesson.lesson_key,
      lesson_number: lesson.lesson_number,
      title: lesson.title,
      lesson_order: lesson.lesson_order,
      description: lesson.description,
      updated_at: new Date().toISOString(),
     },
     { onConflict: "course_id,lesson_key" },
    )
    .select("*")
    .single();
   if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 });
   importedLessons += 1;

   for (const point of lesson.points) {
    const { data: insertedPoint, error: pointError } = await supabase
     .from("grammar_points")
     .insert({
      course_id: course.id,
      lesson_id: insertedLesson.id,
      title: point.title,
      hanzi: point.hanzi || null,
      pinyin: point.pinyin || null,
      vietnamese_title: point.vietnamese_title || null,
      level: point.level || null,
      category: point.category || null,
      tags: point.tags,
      row_number: point.row_number,
      content: {
       ...point.content,
       source_metadata: {
        ...point.content.source_metadata,
        course_key: course.course_key,
        lesson_key: insertedLesson.lesson_key,
        lesson_number: insertedLesson.lesson_number,
        lesson_title: insertedLesson.title,
        source: "Np.md",
       },
      },
     })
     .select("id")
     .single();
    if (pointError) return NextResponse.json({ error: pointError.message }, { status: 500 });
    await supabase.from("user_grammar_point_progress").upsert({
     user_id: user.id,
     point_id: insertedPoint.id,
     proficiency_level: 0,
     updated_at: new Date().toISOString(),
    });
    importedPoints += 1;
   }
  }

  await supabase.from("grammar_courses").update({ updated_at: new Date().toISOString() }).eq("id", course.id);
  return NextResponse.json({ importedLessons, importedPoints, courseId: course.id });
 } catch (error) {
  if (isMissingGrammarTableError(error as { code?: string; message?: string })) {
   return migrationRequired((error as Error).message);
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Import Np.md thất bại" }, { status: 500 });
 }
}
