import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import {
 getPublishedStudioCourseLessons,
 mergePublishedStudioCatalog,
} from "@/features/hanzihome/static-json/studio-published-content.server";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBooleanParam(value: ReturnType<URLSearchParams["get"]>) {
 return value === "1" || value === "true";
}

export async function GET(request: Request) {
 try {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();

  if (courseId) {
   const publishedLessons = getPublishedStudioCourseLessons(courseId);
   if (publishedLessons) return privateNoStoreJson({ lessons: publishedLessons });

   const auth = await requireAuthenticatedRoute();
   if (!auth.authenticated) return auth.response;

   const lessons = await hanzihomeContentRepository.getCourseLessonSummaries(courseId);

   return privateNoStoreJson({ lessons });
  }

  const includeLessons = parseBooleanParam(url.searchParams.get("includeLessons"));
  const includeRadicals = parseBooleanParam(url.searchParams.get("includeRadicals"));
  const auth = await requireAuthenticatedRoute();
  if (!auth.authenticated) return auth.response;
  const catalog = await hanzihomeContentRepository.getCatalogSummary({
   includeLessons,
   includeRadicals,
  });
  return privateNoStoreJson({ catalog: mergePublishedStudioCatalog(catalog, includeLessons) });
 } catch {
  return apiError("Could not load HanziHome catalog", 503, "CATALOG_UNAVAILABLE");
 }
}
