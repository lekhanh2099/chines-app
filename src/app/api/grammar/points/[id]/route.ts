import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GrammarPointContent } from "@/types/database";

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
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
 if (body.lesson_id !== undefined) payload.lesson_id = body.lesson_id;
 if (body.title !== undefined) payload.title = body.title.trim();
 if (body.hanzi !== undefined) payload.hanzi = body.hanzi || null;
 if (body.pinyin !== undefined) payload.pinyin = body.pinyin || null;
 if (body.vietnamese_title !== undefined) payload.vietnamese_title = body.vietnamese_title || null;
 if (body.level !== undefined) payload.level = body.level || null;
 if (body.category !== undefined) payload.category = body.category || null;
 if (body.tags !== undefined) payload.tags = body.tags;
 if (body.row_number !== undefined) payload.row_number = Number(body.row_number);
 if (body.content !== undefined) payload.content = body.content;

 const { data, error } = await supabase
  .from("grammar_points")
  .update(payload)
  .eq("id", id)
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ point: data });
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
 const { error } = await supabase.from("grammar_points").delete().eq("id", id);
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ ok: true });
}
