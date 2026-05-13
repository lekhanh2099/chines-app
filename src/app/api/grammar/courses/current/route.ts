import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingGrammarTableError } from "@/services/grammar-learning.service";

export const dynamic = "force-dynamic";

export async function GET() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { data, error } = await supabase
  .from("grammar_courses")
  .select("*")
  .eq("owner_id", user.id)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

 if (isMissingGrammarTableError(error)) {
  return NextResponse.json(
   {
    error: "Database grammar schema chưa được apply. Chạy migration supabase/migrations/20260312000016_grammar_learning.sql trước.",
    migrationRequired: true,
   },
   { status: 409 },
  );
 }
 if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 return NextResponse.json({ course: data });
}
