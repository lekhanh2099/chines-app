import { NextResponse } from "next/server";
import { z } from "zod";

import { createHanziHomeCourseBookRequestSchema } from "@/features/hanzihome/courses/course.schema";
import { createClient } from "@/lib/supabase/server";

const bookRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  title: z.string(),
  short_title: z.string().nullable(),
  book_order: z.number().nullable(),
});

function mapBook(row: unknown) {
  const parsed = bookRowSchema.parse(row);

  return {
    id: parsed.id,
    courseId: parsed.course_id,
    title: parsed.title,
    shortTitle: parsed.short_title ?? undefined,
    order: parsed.book_order ?? 1,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = createHanziHomeCourseBookRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid HanziHome course book payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const title = parsed.data.title.trim();

  const { data: existingBook, error: existingError } = await supabase
    .from("hanzihome_course_books")
    .select("id, course_id, title, short_title, book_order")
    .eq("user_id", user.id)
    .eq("course_id", parsed.data.courseId)
    .ilike("title", title)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: "Could not check existing HanziHome course book" },
      { status: 500 },
    );
  }

  if (existingBook) {
    return NextResponse.json({ book: mapBook(existingBook) });
  }

  const { data: latestBook } = await supabase
    .from("hanzihome_course_books")
    .select("book_order")
    .eq("user_id", user.id)
    .eq("course_id", parsed.data.courseId)
    .order("book_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestOrder =
    (latestBook as { book_order?: number | null } | null)?.book_order ?? 0;

  const { data: bookRow, error: bookError } = await supabase
    .from("hanzihome_course_books")
    .insert({
      user_id: user.id,
      course_id: parsed.data.courseId,
      title,
      short_title: parsed.data.shortTitle || title,
      book_order: parsed.data.order ?? latestOrder + 1,
      updated_at: new Date().toISOString(),
    })
    .select("id, course_id, title, short_title, book_order")
    .single();

  if (bookError || !bookRow) {
    return NextResponse.json(
      { error: "Could not create HanziHome course book" },
      { status: 500 },
    );
  }

  return NextResponse.json({ book: mapBook(bookRow) }, { status: 201 });
}
