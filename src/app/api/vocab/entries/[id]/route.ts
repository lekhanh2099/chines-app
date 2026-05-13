import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AiAnalysis } from "@/types/database";

export const dynamic = "force-dynamic";

type EntryPatch = {
 hanzi?: string;
 lesson_id?: string;
 pinyin?: string;
 sino_vietnamese?: string;
 meaning?: string;
 word_type?: string;
 category?: string;
 row_number?: number;
 ai_analysis?: AiAnalysis;
};

export async function PATCH(
 request: NextRequest,
 { params }: { params: Promise<{ id: string }> },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const body = (await request.json()) as EntryPatch;
 const aiAnalysis = body.ai_analysis ? { ...body.ai_analysis } : undefined;

 let nextLesson:
  | {
     id: string;
     course_id: string;
     lesson_key: string;
     lesson_number: number | null;
     title: string;
    }
  | null = null;
 if (body.lesson_id) {
  const { data: lesson, error: lessonError } = await supabase
   .from("vocab_lessons")
   .select("id, course_id, lesson_key, lesson_number, title")
   .eq("id", body.lesson_id)
   .single();
  if (lessonError) return NextResponse.json({ error: lessonError.message }, { status: 500 });
  nextLesson = lesson;
 }

 if (aiAnalysis?.source_metadata) {
  aiAnalysis.source_metadata = {
   ...aiAnalysis.source_metadata,
   ...(nextLesson
    ? {
       lesson_key: nextLesson.lesson_key,
       lesson_number: nextLesson.lesson_number,
       lesson_title: nextLesson.title,
      }
    : {}),
   ...(body.row_number !== undefined ? { row_number: Number(body.row_number) } : {}),
   ...(body.category !== undefined ? { category: body.category } : {}),
  };
 }

 const updatePayload: Record<string, unknown> = {
  updated_at: new Date().toISOString(),
 };
 for (const key of ["hanzi", "lesson_id", "pinyin", "sino_vietnamese", "meaning", "word_type", "category"] as const) {
  if (body[key] !== undefined) updatePayload[key] = body[key] || null;
 }
 if (body.row_number !== undefined) updatePayload.row_number = Number(body.row_number);
 if (nextLesson) updatePayload.course_id = nextLesson.course_id;
 if (aiAnalysis) updatePayload.ai_analysis = aiAnalysis;

 const { data, error } = await supabase
  .from("vocab_entries")
  .update(updatePayload)
  .eq("id", id)
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ entry: data });
}

export async function DELETE(
 _request: NextRequest,
 { params }: { params: Promise<{ id: string }> },
) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { id } = await params;
 const { error } = await supabase.from("vocab_entries").delete().eq("id", id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ ok: true });
}
