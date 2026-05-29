import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const grammarRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_id: z.string(),
 point_order: z.number(),
 title: z.string(),
 clean_title: z.string(),
 core: z.string(),
});

const lessonRowSchema = z.object({
 id: z.string(),
 lesson_number: z.number(),
 lesson_order: z.number(),
 title_zh: z.string(),
 title_vi: z.string().nullable(),
});

function parseLimit(value: string | null) {
 if (value === null || value.trim() === "") return 1000;

 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1000;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1000);
}

function matchesQuery(row: z.infer<typeof grammarRowSchema>, query: string) {
 if (!query) return true;

 const normalized = query.toLocaleLowerCase("vi");
 const source = [row.title, row.clean_title, row.core].join("\n");

 return source.toLocaleLowerCase("vi").includes(normalized);
}

export async function GET(request: Request) {
 const url = new URL(request.url);
 const limit = parseLimit(url.searchParams.get("limit"));
 const courseId = url.searchParams.get("courseId");
 const bookId = url.searchParams.get("bookId");
 const lessonId = url.searchParams.get("lessonId");
 const query = url.searchParams.get("q")?.trim() ?? "";
 const supabase = await createClient();

 let builder = supabase
  .from("hanzihome_grammar_points")
  .select(
   "id, course_id, book_id, lesson_id, point_order, title, clean_title, core",
  )
  .eq("source", "custom")
  .order("lesson_id", { ascending: true })
  .order("point_order", { ascending: true })
  .limit(limit);

 if (courseId) builder = builder.eq("course_id", courseId);
 if (bookId) builder = builder.eq("book_id", bookId);
 if (lessonId) builder = builder.eq("lesson_id", lessonId);

 const { data: grammarData, error: grammarError } = await builder;

 if (grammarError) {
  return NextResponse.json(
   { error: "Could not load HanziHome grammar" },
   { status: 500 },
  );
 }

 const grammarRows = z.array(grammarRowSchema).parse(grammarData ?? []);
 const filteredRows = grammarRows.filter((row) => matchesQuery(row, query));
 const lessonIds = Array.from(
  new Set(filteredRows.map((row) => row.lesson_id)),
 );

 const lessonRows: Array<z.infer<typeof lessonRowSchema>> = [];

 if (lessonIds.length > 0) {
  const { data: lessonData, error: lessonError } = await supabase
   .from("hanzihome_lessons")
   .select("id, lesson_number, lesson_order, title_zh, title_vi")
   .in("id", lessonIds);

  if (lessonError) {
   return NextResponse.json(
    { error: "Could not load HanziHome lesson metadata" },
    { status: 500 },
   );
  }

  lessonRows.push(...z.array(lessonRowSchema).parse(lessonData ?? []));
 }

 const lessonsById = new Map(lessonRows.map((lesson) => [lesson.id, lesson]));
 const items = filteredRows
  .map((row) => {
   const lesson = lessonsById.get(row.lesson_id);

   return {
    id: row.id,
    courseId: row.course_id,
    bookId: row.book_id,
    lessonId: row.lesson_id,
    lessonNumber: lesson?.lesson_number ?? 0,
    lessonOrder: lesson?.lesson_order ?? row.point_order,
    lessonTitle: lesson?.title_vi || lesson?.title_zh || row.lesson_id,
    title: row.title,
    cleanTitle: row.clean_title,
    core: row.core,
   };
  })
  .sort(
   (a, b) =>
    a.lessonOrder - b.lessonOrder ||
    a.lessonNumber - b.lessonNumber ||
    a.cleanTitle.localeCompare(b.cleanTitle),
  )
  .slice(0, limit);

 return NextResponse.json(
  { items, debug: { source: "db-grammar", limit, count: items.length } },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
