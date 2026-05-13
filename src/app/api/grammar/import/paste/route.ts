import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingGrammarTableError, parseGrammarMarkdown } from "@/services/grammar-learning.service";
import type { DbGrammarCourse, DbGrammarLesson } from "@/types/database";

export const dynamic = "force-dynamic";

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

async function getOrCreateCourse(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
 const { data: existing, error: existingError } = await supabase
  .from("grammar_courses")
  .select("*")
  .eq("owner_id", userId)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();
 if (existingError) throw existingError;
 if (existing) return existing as DbGrammarCourse;

 const { data, error } = await supabase
  .from("grammar_courses")
  .insert({ owner_id: userId, course_key: "custom-grammar", title: "Ngữ pháp cá nhân", source_type: "custom" })
  .select("*")
  .single();
 if (error) throw error;
 return data as DbGrammarCourse;
}

async function getOrCreateLesson(
 supabase: Awaited<ReturnType<typeof createClient>>,
 courseId: string,
 lessonId?: string | null,
) {
 if (lessonId) {
  const { data, error } = await supabase.from("grammar_lessons").select("*").eq("id", lessonId).single();
  if (error) throw error;
  return data as DbGrammarLesson;
 }
 const { data: existing, error: existingError } = await supabase
  .from("grammar_lessons")
  .select("*")
  .eq("course_id", courseId)
  .order("lesson_order", { ascending: true })
  .limit(1)
  .maybeSingle();
 if (existingError) throw existingError;
 if (existing) return existing as DbGrammarLesson;

 const { data, error } = await supabase
  .from("grammar_lessons")
  .insert({
   course_id: courseId,
   lesson_key: "G01",
   lesson_number: 1,
   title: "Bài ngữ pháp đầu tiên",
   lesson_order: 1,
  })
  .select("*")
  .single();
 if (error) throw error;
 return data as DbGrammarLesson;
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 try {
  const body = (await request.json()) as { text?: string; lesson_id?: string | null };
  if (!body.text?.trim()) return NextResponse.json({ error: "Thiếu nội dung paste" }, { status: 400 });

  const course = await getOrCreateCourse(supabase, user.id);
  const lesson = await getOrCreateLesson(supabase, course.id, body.lesson_id);
  const parsed = parseGrammarMarkdown(body.text, lesson, course.id);
  if (!parsed.length) return NextResponse.json({ error: "Không parse được ngữ pháp nào từ nội dung paste" }, { status: 400 });

  const { count, error: countError } = await supabase
   .from("grammar_points")
   .select("id", { count: "exact", head: true })
   .eq("lesson_id", lesson.id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  let imported = 0;
  for (const [index, point] of parsed.entries()) {
   const rowNumber = (count || 0) + index + 1;
   const { data: inserted, error: pointError } = await supabase
    .from("grammar_points")
    .insert({
     course_id: course.id,
     lesson_id: lesson.id,
     title: point.title,
     hanzi: point.hanzi || null,
     pinyin: point.pinyin || null,
     vietnamese_title: point.vietnamese_title || null,
     level: point.level || null,
     category: point.category || null,
     tags: point.tags,
     row_number: rowNumber,
     content: {
      ...point.content,
      source_metadata: {
       ...point.content.source_metadata,
       course_key: course.course_key,
       lesson_key: lesson.lesson_key,
       lesson_number: lesson.lesson_number,
       lesson_title: lesson.title,
       row_number: rowNumber,
       source: "paste",
      },
     },
    })
    .select("*")
    .single();
   if (pointError) throw pointError;

   await supabase.from("user_grammar_point_progress").upsert({
    user_id: user.id,
    point_id: inserted.id,
    proficiency_level: 0,
    updated_at: new Date().toISOString(),
   });

   if (point.exerciseDrafts.length) {
    const exerciseRows = point.exerciseDrafts.map((exercise, exerciseIndex) => ({
     ...exercise,
     point_id: inserted.id,
     lesson_id: lesson.id,
     exercise_order: exerciseIndex + 1,
    }));
    const { error: exerciseError } = await supabase.from("grammar_exercises").insert(exerciseRows);
    if (exerciseError) throw exerciseError;
   }
   imported += 1;
  }

  await supabase
   .from("grammar_courses")
   .update({ updated_at: new Date().toISOString() })
   .eq("id", course.id);

  return NextResponse.json({ imported, lessonId: lesson.id });
 } catch (error) {
  if (isMissingGrammarTableError(error as { code?: string; message?: string })) {
   return migrationRequired((error as Error).message);
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Import ngữ pháp thất bại" }, { status: 500 });
 }
}
