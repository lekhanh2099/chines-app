import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
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
  point_id?: string | null;
  submitted_answer?: Record<string, unknown>;
  is_correct?: boolean | null;
 };

 const { data, error } = await supabase
  .from("user_grammar_exercise_attempts")
  .insert({
   user_id: user.id,
   exercise_id: id,
   point_id: body.point_id || null,
   submitted_answer: body.submitted_answer || {},
   is_correct: body.is_correct ?? null,
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ attempt: data });
}
