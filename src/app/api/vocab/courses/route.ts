import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { data, error } = await supabase
  .from("vocab_courses")
  .select("id, course_key, title, source_file, imported_at")
  .eq("owner_id", user.id)
  .order("imported_at", { ascending: false });

 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ courses: data || [] });
}
