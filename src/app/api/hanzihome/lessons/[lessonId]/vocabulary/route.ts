import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { getStaticStudioLessonDetail } from "@/features/hanzihome/static-json/studio-static-content";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  if (lessonId.startsWith("hanzihome-studio-")) {
   const lesson = getStaticStudioLessonDetail(lessonId);
   if (!lesson) return apiError("Lesson not found", 404, "LESSON_NOT_FOUND");
   return privateNoStoreJson({
    resource: {
     lessonId,
     items: lesson.vocab,
     total: lesson.vocab.length,
    },
   });
  }

  const auth = await requireAuthenticatedRoute();
  if (!auth.authenticated) return auth.response;

  const resource = await hanzihomeContentRepository.getLessonVocabulary(lessonId);
  if (!resource) return apiError("Lesson not found", 404, "LESSON_NOT_FOUND");
  return privateNoStoreJson({ resource });
 } catch {
  return apiError("Could not load lesson vocabulary", 503, "VOCABULARY_UNAVAILABLE");
 }
}
