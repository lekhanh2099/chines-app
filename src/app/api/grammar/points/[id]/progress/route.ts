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
 const body = (await request.json()) as { proficiency_level?: number };
 const level = Math.max(0, Math.min(5, Number(body.proficiency_level ?? 0)));
 const now = new Date().toISOString();

 const { data, error } = await supabase
  .from("user_grammar_point_progress")
  .upsert({
   user_id: user.id,
   point_id: id,
   proficiency_level: level,
   last_studied_at: now,
   updated_at: now,
  })
  .select("*")
  .single();

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ progress: data });
}
