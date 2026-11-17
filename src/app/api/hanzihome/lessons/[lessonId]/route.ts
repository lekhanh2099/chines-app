import { getPublishedStudioLessonDetail } from "@/features/hanzihome/static-json/studio-published-content.server";
import { apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{
  lessonId: string;
 }>;
};

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  const lesson = getPublishedStudioLessonDetail(lessonId);
  if (!lesson) return apiError("Lesson not found", 404, "LESSON_NOT_FOUND");
  return privateNoStoreJson({ lesson });
 } catch {
  return apiError("Could not load lesson", 503, "LESSON_UNAVAILABLE");
 }
}
