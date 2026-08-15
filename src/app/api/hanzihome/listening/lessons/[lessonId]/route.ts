import { fetchListeningLessonBundle } from "@/features/hanzihome/listening/listening.repository";
import { getStaticStudioListeningLessonBundle } from "@/features/hanzihome/static-json/studio-static-content";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
 params: Promise<{ lessonId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
 try {
  const { lessonId } = await context.params;
  if (lessonId.startsWith("hanzihome-studio-dictation:")) {
   const bundle = getStaticStudioListeningLessonBundle(lessonId);
   if (!bundle) {
    return apiError("Listening lesson not found", 404, "LISTENING_LESSON_NOT_FOUND");
   }
   return privateNoStoreJson({ bundle });
  }

  const auth = await requireAuthenticatedRoute();
  if (!auth.authenticated) return auth.response;

  const bundle = await fetchListeningLessonBundle(auth.context.supabase, lessonId);

  if (!bundle) {
   return apiError("Listening lesson not found", 404, "LISTENING_LESSON_NOT_FOUND");
  }

  return privateNoStoreJson({ bundle });
 } catch {
  return apiError("Could not load listening lesson", 503, "LISTENING_UNAVAILABLE");
 }
}
