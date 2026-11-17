import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import {
 getPublishedStudioCatalog,
 getPublishedStudioCourseLessons,
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
   const lessons = getPublishedStudioCourseLessons(courseId);
   if (!lessons) return apiError("Course not found", 404, "COURSE_NOT_FOUND");
   return privateNoStoreJson({ lessons });
  }

  const includeLessons = parseBooleanParam(url.searchParams.get("includeLessons"));
  const includeRadicals = parseBooleanParam(url.searchParams.get("includeRadicals"));
  const auth = await requireAuthenticatedRoute();
  if (!auth.authenticated) return auth.response;
  const radicals = includeRadicals ? await hanzihomeContentRepository.getRadicals() : [];
  return privateNoStoreJson({ catalog: getPublishedStudioCatalog({ includeLessons, radicals }) });
 } catch {
  return apiError("Could not load HanziHome catalog", 503, "CATALOG_UNAVAILABLE");
 }
}
