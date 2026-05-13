import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GrammarExerciseContent, GrammarExerciseType } from "@/types/database";

export const dynamic = "force-dynamic";

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
 const body = (await request.json()) as {
  lesson_id?: string | null;
  point_id?: string | null;
  exercise_type?: GrammarExerciseType;
  prompt?: string;
  content?: GrammarExerciseContent;
  answer?: Record<string, unknown>;
  explanation?: string;
  exercise_order?: number;
 };
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
 if (body.lesson_id !== undefined) payload.lesson_id = body.lesson_id;
 if (body.point_id !== undefined) payload.point_id = body.point_id;
 if (body.exercise_type !== undefined) payload.exercise_type = body.exercise_type;
 if (body.prompt !== undefined) payload.prompt = body.prompt.trim();
 if (body.content !== undefined) payload.content = body.content;
 if (body.answer !== undefined) payload.answer = body.answer;
 if (body.explanation !== undefined) payload.explanation = body.explanation || null;
 if (body.exercise_order !== undefined) payload.exercise_order = Number(body.exercise_order);

 const { data, error } = await supabase
  .from("grammar_exercises")
  .update(payload)
  .eq("id", id)
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ exercise: data });
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
 const { error } = await supabase.from("grammar_exercises").delete().eq("id", id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ ok: true });
}
