import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createHanziHomeCourseRequestSchema,
  hanziHomeCourseTypeSchema,
} from "@/features/hanzihome/courses/course.schema";
import { createClient } from "@/lib/supabase/server";

const courseRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  type: z.string(),
  course_order: z.number().nullable(),
});

const bookRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  title: z.string(),
  short_title: z.string().nullable(),
  book_order: z.number().nullable(),
});

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || "custom-course";
}

function mapCourse(row: unknown) {
  const parsed = courseRowSchema.parse(row);
  const courseType = hanziHomeCourseTypeSchema.safeParse(parsed.type);

  return {
    id: parsed.id,
    slug: parsed.slug,
    title: parsed.title,
    subtitle: parsed.subtitle ?? undefined,
    type: courseType.success ? courseType.data : "custom",
    order: parsed.course_order ?? 1000,
  };
}

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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [coursesResult, booksResult] = await Promise.all([
    supabase
      .from("hanzihome_courses")
      .select("id, slug, title, subtitle, type, course_order")
      .eq("user_id", user.id)
      .order("course_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("hanzihome_course_books")
      .select("id, course_id, title, short_title, book_order")
      .eq("user_id", user.id)
      .order("book_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (coursesResult.error || booksResult.error) {
    return NextResponse.json(
      { error: "Could not load HanziHome courses" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    courses: (coursesResult.data ?? []).map(mapCourse),
    books: (booksResult.data ?? []).map(mapBook),
  });
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
  const parsed = createHanziHomeCourseRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid HanziHome course payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data: courseRow, error: courseError } = await supabase
    .from("hanzihome_courses")
    .insert({
      user_id: user.id,
      slug: slugify(parsed.data.title),
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      type: parsed.data.type,
      course_order: 1000,
      updated_at: now,
    })
    .select("id, slug, title, subtitle, type, course_order")
    .single();

  if (courseError || !courseRow) {
    return NextResponse.json(
      { error: "Could not create HanziHome course" },
      { status: 500 },
    );
  }

  const { data: bookRow, error: bookError } = await supabase
    .from("hanzihome_course_books")
    .insert({
      user_id: user.id,
      course_id: courseRow.id,
      title: parsed.data.initialBookTitle,
      short_title: parsed.data.initialBookShortTitle || null,
      book_order: 1,
      updated_at: now,
    })
    .select("id, course_id, title, short_title, book_order")
    .single();

  if (bookError || !bookRow) {
    await supabase.from("hanzihome_courses").delete().eq("id", courseRow.id);

    return NextResponse.json(
      { error: "Could not create HanziHome course book" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      course: mapCourse(courseRow),
      book: mapBook(bookRow),
    },
    { status: 201 },
  );
}
