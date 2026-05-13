import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LessonCreate = {
 course_id?: string;
 lesson_key?: string;
 lesson_number?: number | null;
 title?: string;
 lesson_order?: number;
};

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = (await request.json()) as LessonCreate;
 let courseId = body.course_id;
 if (!courseId) {
  const { data: course, error: courseError } = await supabase
   .from("vocab_courses")
   .select("id")
   .eq("owner_id", user.id)
   .order("imported_at", { ascending: false })
   .limit(1)
   .maybeSingle();
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 500 });
  courseId = course?.id;
 }
 if (!courseId) return NextResponse.json({ error: "Không tìm thấy course hiện tại" }, { status: 400 });

 const lessonOrder = Number(body.lesson_order || 1);
 const lessonNumber = body.lesson_number ?? lessonOrder;
 const lessonKey = (body.lesson_key || `L${String(lessonNumber).padStart(2, "0")}`).trim();
 const title = (body.title || `Bài ${lessonNumber}`).trim();

 const { data, error } = await supabase
  .from("vocab_lessons")
  .insert({
   course_id: courseId,
   lesson_key: lessonKey,
   lesson_number: lessonNumber,
   title,
   lesson_order: lessonOrder,
   item_count: 0,
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ lesson: data });
}
