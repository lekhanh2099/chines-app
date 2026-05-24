import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const aggregateGrammarRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_id: z.string(),
 lesson_number: z.number(),
 lesson_order: z.number(),
 lesson_title: z.string(),
 title: z.string(),
 clean_title: z.string(),
 core: z.string(),
});

function parseLimit(value: string | null) {
 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1000;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1000);
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const courseId = url.searchParams.get("courseId");
 const bookId = url.searchParams.get("bookId");
 const lessonId = url.searchParams.get("lessonId");
 const q = url.searchParams.get("q")?.trim() || null;
 const limit = parseLimit(url.searchParams.get("limit"));

 try {
  const supabase = await createClient();

  const result = await supabase.rpc("get_hanzihome_aggregate_grammar", {
   p_course_id: courseId || null,
   p_book_id: bookId || null,
   p_lesson_id: lessonId || null,
   p_q: q,
   p_limit: limit,
  });

  if (result.error) {
   return NextResponse.json(
    { items: [], error: result.error.message },
    { status: 500 },
   );
  }

  const rows = z.array(aggregateGrammarRowSchema).parse(result.data ?? []);
  const items = rows.map((row) => ({
   id: row.id,
   courseId: row.course_id,
   bookId: row.book_id,
   lessonId: row.lesson_id,
   lessonNumber: row.lesson_number,
   lessonOrder: row.lesson_order,
   lessonTitle: row.lesson_title,
   title: row.title,
   cleanTitle: row.clean_title,
   core: row.core,
  }));

  return NextResponse.json(
   { items },
   {
    headers: {
     "Cache-Control": "no-store",
    },
   },
  );
 } catch {
  return NextResponse.json({ items: [] }, { status: 500 });
 }
}
