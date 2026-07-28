import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
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
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 try {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();

  if (courseId) {
   const lessons = await hanzihomeContentRepository.getCourseLessonSummaries(courseId);

   return privateNoStoreJson({ lessons });
  }

  const includeLessons = parseBooleanParam(url.searchParams.get("includeLessons"));
  const catalog = await hanzihomeContentRepository.getCatalogSummary({
   includeLessons,
  });

  return privateNoStoreJson({ catalog });
 } catch {
  return apiError("Could not load HanziHome catalog", 503, "CATALOG_UNAVAILABLE");
 }
}
