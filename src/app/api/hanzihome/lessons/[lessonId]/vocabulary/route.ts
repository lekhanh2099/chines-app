import { getPublishedStudioLessonVocabulary } from "@/features/hanzihome/static-json/studio-published-content.server";
import { apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  const resource = getPublishedStudioLessonVocabulary(lessonId);
  if (!resource) return apiError("Lesson not found", 404, "LESSON_NOT_FOUND");
  return privateNoStoreJson({ resource });
 } catch {
  return apiError("Could not load lesson vocabulary", 503, "VOCABULARY_UNAVAILABLE");
 }
}
