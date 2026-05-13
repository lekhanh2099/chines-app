import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  lesson_key?: string;
  lesson_number?: number | null;
  title?: string;
  lesson_order?: number;
 };
 const payload: Record<string, unknown> = {
  updated_at: new Date().toISOString(),
 };
 if (body.lesson_key !== undefined) payload.lesson_key = body.lesson_key.trim();
 if (body.lesson_number !== undefined) payload.lesson_number = body.lesson_number;
 if (body.title !== undefined) payload.title = body.title.trim();
 if (body.lesson_order !== undefined) payload.lesson_order = Number(body.lesson_order);

 const { data, error } = await supabase
  .from("vocab_lessons")
  .update(payload)
  .eq("id", id)
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ lesson: data });
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
 const { error } = await supabase.from("vocab_lessons").delete().eq("id", id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ ok: true });
}
