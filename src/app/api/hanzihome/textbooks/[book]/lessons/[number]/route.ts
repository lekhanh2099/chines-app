import { NextResponse } from "next/server";

import { courseBookKeySchema } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { getTextbookLessonOnServer } from "@/features/hanzihome/static-json/course-textbooks.server";
import { apiError } from "@/lib/api/authenticated-route";

type RouteContext = {
 params: Promise<{
  book: string;
  number: string;
 }>;
};

/**
 * One lesson of a converted course book. Their content is public textbook data
 * (the `/textbooks` pages are public) but too large to bundle in the client.
 */
export async function GET(_request: Request, context: RouteContext) {
 const params = await context.params;
 const book = courseBookKeySchema.safeParse(params.book);
 const lessonNumber = Number(params.number);
 if (!book.success || !Number.isInteger(lessonNumber)) {
  return apiError("Unknown textbook lesson", 404, "TEXTBOOK_LESSON_NOT_FOUND");
 }
 const lesson = getTextbookLessonOnServer(book.data, lessonNumber);
 if (!lesson) return apiError("Unknown textbook lesson", 404, "TEXTBOOK_LESSON_NOT_FOUND");
 return NextResponse.json(
  { lesson },
  { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
 );
}
