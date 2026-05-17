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
  proficiency_level?: number;
  is_favorited?: boolean;
  reset?: boolean;
 };

 const level =
  body.proficiency_level === undefined
   ? undefined
   : Math.max(0, Math.min(5, Number(body.proficiency_level)));

 const payload: Record<string, unknown> = {
  user_id: user.id,
  entry_id: id,
  updated_at: new Date().toISOString(),
  last_answered_at: new Date().toISOString(),
 };
 if (body.reset) {
  payload.proficiency_level = 0;
  payload.last_answered_at = null;
 }
 if (level !== undefined) payload.proficiency_level = level;
 if (body.is_favorited !== undefined) payload.is_favorited = body.is_favorited;

 const { data, error } = await supabase
  .from("user_vocab_entry_progress")
  .upsert(payload, { onConflict: "user_id,entry_id" })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ progress: data });
}
