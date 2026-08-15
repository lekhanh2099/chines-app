import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import {
 getStaticStudioCatalog,
 listStaticStudioCourseLessons,
} from "@/features/hanzihome/static-json/studio-static-content";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const staticStudioCatalog = getStaticStudioCatalog();

function parseBooleanParam(value: ReturnType<URLSearchParams["get"]>) {
 return value === "1" || value === "true";
}

export async function GET(request: Request) {
 try {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();

  if (courseId) {
   if (courseId.startsWith("hanzihome-studio-")) {
    return privateNoStoreJson({ lessons: listStaticStudioCourseLessons(courseId) });
   }

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
  return privateNoStoreJson({
   catalog: {
    ...catalog,
    courses: [...catalog.courses, ...staticStudioCatalog.courses],
    books: [...catalog.books, ...staticStudioCatalog.books],
    lessons: includeLessons
     ? [...catalog.lessons, ...staticStudioCatalog.lessons]
     : catalog.lessons,
   },
  });
 } catch {
  return apiError("Could not load HanziHome catalog", 503, "CATALOG_UNAVAILABLE");
 }
}
