import { NextResponse } from "next/server";

import { textbookLessonSchema } from "@/features/hanzihome/static-json/textbook-catalog";
import { getTextbookLessonOnServer } from "@/features/hanzihome/static-json/course-textbooks.server";
import { apiError } from "@/lib/api/authenticated-route";

type RouteContext = {
 params: Promise<{
  book: string;
  number: string;
 }>;
};

/**
 * One textbook lesson. The content is public (the textbook pages are public) but
 * too large to bundle in the client, so client features load it on demand.
 */
export async function GET(_request: Request, context: RouteContext) {
 const params = await context.params;
 const book = textbookLessonSchema.shape.bookKey.safeParse(params.book);
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
