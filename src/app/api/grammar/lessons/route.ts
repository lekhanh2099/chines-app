import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LessonBody = {
 course_id?: string;
 lesson_key?: string;
 lesson_number?: number | null;
 title?: string;
 lesson_order?: number;
 description?: string;
};

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = (await request.json()) as LessonBody;
 let courseId = body.course_id;
 if (!courseId) {
  const { data: course, error: courseError } = await supabase
   .from("grammar_courses")
   .select("id")
   .eq("owner_id", user.id)
   .order("updated_at", { ascending: false })
   .limit(1)
   .maybeSingle();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  courseId = course?.id;
 }
 if (!courseId) {
  const { data: course, error: createError } = await supabase
   .from("grammar_courses")
   .insert({ owner_id: user.id, course_key: "custom-grammar", title: "Ngữ pháp cá nhân", source_type: "custom" })
   .select("id")
   .single();
  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });
  courseId = course.id;
 }

 const { count, error: countError } = await supabase
  .from("grammar_lessons")
  .select("id", { count: "exact", head: true })
  .eq("course_id", courseId);
 if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

 const lessonOrder = Number(body.lesson_order || (count || 0) + 1);
 const lessonNumber = body.lesson_number ?? lessonOrder;
 const lessonKey = (body.lesson_key || `G${String(lessonNumber).padStart(2, "0")}`).trim();
 const title = (body.title || `Bài ngữ pháp ${lessonNumber}`).trim();

 const { data, error } = await supabase
  .from("grammar_lessons")
  .insert({
   course_id: courseId,
   lesson_key: lessonKey,
   lesson_number: lessonNumber,
   title,
   lesson_order: lessonOrder,
   description: body.description || null,
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ lesson: data });
}
