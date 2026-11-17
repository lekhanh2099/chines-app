import { getPublishedStudioListeningLessonBundle } from "@/features/hanzihome/static-json/studio-published-content.server";
import { apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{ lessonId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  const bundle = getPublishedStudioListeningLessonBundle(lessonId);
  if (!bundle) {
   return apiError("Listening lesson not found", 404, "LISTENING_LESSON_NOT_FOUND");
  }
  return privateNoStoreJson({ bundle });
 } catch {
  return apiError("Could not load listening lesson", 503, "LISTENING_UNAVAILABLE");
 }
}
