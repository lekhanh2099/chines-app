import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const vocabRowSchema = z.object({
 id: z.string(),
 course_id: z.string(),
 book_id: z.string(),
 lesson_id: z.string(),
 item_order: z.number(),
 word: z.string(),
 pinyin: z.string(),
 han_viet: z.string(),
 meaning: z.string(),
 category: z.string(),
 level: z.string().nullable(),
 pos_vi: z.string().nullable(),
 pos_zh: z.string().nullable(),
});

const lessonRowSchema = z.object({
 id: z.string(),
 lesson_number: z.number(),
 lesson_order: z.number(),
 title_zh: z.string(),
 title_vi: z.string().nullable(),
});

function parseLimit(value: string | null) {
 if (value === null || value.trim() === "") return 1500;

 const parsed = Number(value);

 if (!Number.isFinite(parsed)) return 1500;

 return Math.min(Math.max(Math.trunc(parsed), 1), 1500);
}

function matchesQuery(row: z.infer<typeof vocabRowSchema>, query: string) {
 if (!query) return true;

 const normalized = query.toLocaleLowerCase("vi");
 const source = [
  row.word,
  row.pinyin,
  row.han_viet,
  row.meaning,
  row.category,
  row.level ?? "",
  row.pos_vi ?? "",
  row.pos_zh ?? "",
 ].join("\n");

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
  .from("hanzihome_vocab_items")
  .select(
   "id, course_id, book_id, lesson_id, item_order, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh",
  )
  .eq("source", "custom")
  .order("lesson_id", { ascending: true })
  .order("item_order", { ascending: true })
  .limit(limit);

 if (courseId) builder = builder.eq("course_id", courseId);
 if (bookId) builder = builder.eq("book_id", bookId);
 if (lessonId) builder = builder.eq("lesson_id", lessonId);

 const { data: vocabData, error: vocabError } = await builder;

 if (vocabError) {
  return NextResponse.json(
   { error: "Could not load HanziHome vocabulary" },
   { status: 500 },
  );
 }

 const vocabRows = z.array(vocabRowSchema).parse(vocabData ?? []);
 const filteredRows = vocabRows.filter((row) => matchesQuery(row, query));
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
    lessonOrder: lesson?.lesson_order ?? row.item_order,
    lessonTitle: lesson?.title_vi || lesson?.title_zh || row.lesson_id,
    word: row.word,
    pinyin: row.pinyin,
    hanViet: row.han_viet,
    meaning: row.meaning,
    category: row.category,
    level: row.level,
    pos:
     row.pos_vi || row.pos_zh
      ? {
         vi: row.pos_vi,
         zh: row.pos_zh,
        }
      : undefined,
   };
  })
  .sort(
   (a, b) =>
    a.lessonOrder - b.lessonOrder ||
    a.lessonNumber - b.lessonNumber ||
    a.word.localeCompare(b.word),
  )
  .slice(0, limit);

 return NextResponse.json(
  { items, debug: { source: "db-vocab", limit, count: items.length } },
  {
   headers: {
    "Cache-Control": "no-store",
   },
  },
 );
}
