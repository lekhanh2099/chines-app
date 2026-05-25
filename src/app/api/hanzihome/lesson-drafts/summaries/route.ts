import { NextResponse } from "next/server";

import { toLessonDraftSummary } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { data, error } = await supabase
  .from("hanzihome_lesson_drafts")
  .select(
   "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at",
  )
  .eq("user_id", user.id)
  .order("lesson_number", { ascending: true })
  .order("created_at", { ascending: false });

 if (error) {
  return NextResponse.json(
   { error: "Could not load lesson draft summaries" },
   { status: 500 },
  );
 }

 return NextResponse.json(
  {
   drafts: (data ?? []).map(toLessonDraftSummary),
  },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
