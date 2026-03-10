import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { searchNotesByTitle } from "@/services/notes.service";

/**
 * GET /api/notes/search?q=<query>
 * Search user's notes by title for the "Link to note" feature.
 */
export async function GET(request: NextRequest) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const query = request.nextUrl.searchParams.get("q")?.trim() || "";
 const notes = await searchNotesByTitle(supabase, user.id, query, 10);

 return NextResponse.json({ notes });
}
