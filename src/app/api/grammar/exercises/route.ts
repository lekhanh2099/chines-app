import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GrammarExerciseContent, GrammarExerciseType } from "@/types/database";

export const dynamic = "force-dynamic";

type ExerciseBody = {
 course_id?: string;
 lesson_id?: string | null;
 point_id?: string | null;
 exercise_type?: GrammarExerciseType;
 prompt?: string;
 content?: GrammarExerciseContent;
 answer?: Record<string, unknown>;
 explanation?: string;
 exercise_order?: number;
};

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = (await request.json()) as ExerciseBody;
 if (!body.prompt?.trim()) return NextResponse.json({ error: "Thiếu câu hỏi bài tập" }, { status: 400 });
 if (!body.exercise_type) return NextResponse.json({ error: "Thiếu loại bài tập" }, { status: 400 });

 let courseId = body.course_id;
 if (!courseId && body.point_id) {
  const { data: point, error: pointError } = await supabase
   .from("grammar_points")
   .select("course_id, lesson_id")
   .eq("id", body.point_id)
   .single();
  if (pointError) return NextResponse.json({ error: pointError.message }, { status: 500 });
  courseId = point.course_id;
 }
 if (!courseId) return NextResponse.json({ error: "Thiếu course cho bài tập" }, { status: 400 });

 const { data, error } = await supabase
  .from("grammar_exercises")
  .insert({
   course_id: courseId,
   lesson_id: body.lesson_id || null,
   point_id: body.point_id || null,
   exercise_type: body.exercise_type,
   prompt: body.prompt.trim(),
   content: body.content || {},
   answer: body.answer || {},
   explanation: body.explanation || null,
   exercise_order: Number(body.exercise_order || 1),
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ exercise: data });
}
