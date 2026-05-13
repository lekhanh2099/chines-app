import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
 buildGrammarPayload,
 grammarStatusFromLevel,
 isMissingGrammarTableError,
} from "@/services/grammar-learning.service";
import type {
 DbGrammarCourse,
 DbGrammarExercise,
 DbGrammarLesson,
 DbGrammarPoint,
 DbUserGrammarPointProgress,
 GrammarCourseWithLessons,
 GrammarPointContent,
} from "@/types/database";

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
 if (isMissingGrammarTableError(existingError)) throw existingError;
 if (existingError) throw existingError;
 if (existing) return existing as DbGrammarCourse;

 const { data, error } = await supabase
  .from("grammar_courses")
  .insert({
   owner_id: userId,
   course_key: "custom-grammar",
   title: "Ngữ pháp cá nhân",
   source_type: "custom",
  })
  .select("*")
  .single();
 if (error) throw error;
 return data as DbGrammarCourse;
}

async function getOrCreateDefaultLesson(
 supabase: Awaited<ReturnType<typeof createClient>>,
 courseId: string,
) {
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
   description: "Nhóm ngữ pháp tự tạo.",
  })
  .select("*")
  .single();
 if (error) throw error;
 return data as DbGrammarLesson;
}

export async function GET(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 try {
  const courseId = request.nextUrl.searchParams.get("courseId");
  const courseQuery = courseId
   ? supabase.from("grammar_courses").select("*").eq("owner_id", user.id).eq("id", courseId).maybeSingle()
   : supabase.from("grammar_courses").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: course, error: courseError } = await courseQuery;
  if (isMissingGrammarTableError(courseError)) return migrationRequired(courseError?.message);
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  if (!course) return NextResponse.json({ course: null, lessons: [], points: [], exercises: [] });

  const { data: lessons, error: lessonsError } = await supabase
   .from("grammar_lessons")
   .select("*")
   .eq("course_id", course.id)
   .order("lesson_order", { ascending: true });
  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });

  const { data: points, error: pointsError } = await supabase
   .from("grammar_points")
   .select("*")
   .eq("course_id", course.id)
   .order("row_number", { ascending: true });
  if (pointsError) return NextResponse.json({ error: pointsError.message }, { status: 500 });

  const { data: exercises, error: exercisesError } = await supabase
   .from("grammar_exercises")
   .select("*")
   .eq("course_id", course.id)
   .order("exercise_order", { ascending: true });
  if (exercisesError) return NextResponse.json({ error: exercisesError.message }, { status: 500 });

  const pointIds = new Set((points || []).map((point) => point.id));
  const { data: progressRows, error: progressError } = pointIds.size
   ? await supabase.from("user_grammar_point_progress").select("*").eq("user_id", user.id)
   : { data: [], error: null };
  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });

  const payload = buildGrammarPayload({
   course: { ...(course as DbGrammarCourse), lessons: [], points: [], exercises: [] } as GrammarCourseWithLessons,
   lessons: (lessons || []) as DbGrammarLesson[],
   points: (points || []) as DbGrammarPoint[],
   exercises: (exercises || []) as DbGrammarExercise[],
   progressRows: ((progressRows || []) as DbUserGrammarPointProgress[]).filter((row) => pointIds.has(row.point_id)),
  });

  return NextResponse.json(payload);
 } catch (error) {
  if (isMissingGrammarTableError(error as { code?: string; message?: string })) {
   return migrationRequired((error as Error).message);
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Không tải được ngữ pháp" }, { status: 500 });
 }
}

type PointBody = {
 course_id?: string;
 lesson_id?: string | null;
 title?: string;
 hanzi?: string;
 pinyin?: string;
 vietnamese_title?: string;
 level?: string;
 category?: string;
 tags?: string[];
 row_number?: number;
 content?: GrammarPointContent;
};

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 try {
  const body = (await request.json()) as PointBody;
  if (!body.title?.trim()) return NextResponse.json({ error: "Thiếu tên ngữ pháp" }, { status: 400 });

  const course = body.course_id
   ? ({ id: body.course_id } as DbGrammarCourse)
   : await getOrCreateCourse(supabase, user.id);
  const lesson = body.lesson_id
   ? null
   : await getOrCreateDefaultLesson(supabase, course.id);
  const lessonId = body.lesson_id ?? lesson?.id ?? null;

  const { count, error: countError } = await supabase
   .from("grammar_points")
   .select("id", { count: "exact", head: true })
   .eq("lesson_id", lessonId);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  const rowNumber = Number(body.row_number || (count || 0) + 1);
  const { data, error } = await supabase
   .from("grammar_points")
   .insert({
    course_id: course.id,
    lesson_id: lessonId,
    title: body.title.trim(),
    hanzi: body.hanzi || null,
    pinyin: body.pinyin || null,
    vietnamese_title: body.vietnamese_title || null,
    level: body.level || null,
    category: body.category || null,
    tags: body.tags || [],
    row_number: rowNumber,
    content: {
     ...(body.content || {}),
     source_metadata: {
      ...body.content?.source_metadata,
      row_number: rowNumber,
     },
    },
   })
   .select("*")
   .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("user_grammar_point_progress").upsert({
   user_id: user.id,
   point_id: data.id,
   proficiency_level: 0,
   updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
   point: {
    ...data,
    content: data.content || {},
    tags: data.tags || [],
    proficiency_level: 0,
    status: grammarStatusFromLevel(0),
    exercises: [],
   },
  });
 } catch (error) {
  if (isMissingGrammarTableError(error as { code?: string; message?: string })) {
   return migrationRequired((error as Error).message);
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Không tạo được ngữ pháp" }, { status: 500 });
 }
}
