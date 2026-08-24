import { hanzihomeContentRepository } from "@/features/hanzihome/repositories/hanzihome-content-repository";
import { getStaticStudioCourseCatalog } from "@/features/hanzihome/static-json/studio-static-content";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const studioGrammarCourseId = "hanzihome-studio-grammar";

function parseBooleanParam(value: ReturnType<URLSearchParams["get"]>) {
 return value === "1" || value === "true";
}

export async function GET(request: Request) {
 try {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId")?.trim();

  if (courseId) {
   if (courseId === studioGrammarCourseId) {
    const staticCourse = getStaticStudioCourseCatalog(courseId);
    if (staticCourse) return privateNoStoreJson({ lessons: staticCourse.lessons });
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
  const staticGrammarCourse = getStaticStudioCourseCatalog(studioGrammarCourseId);
  if (!staticGrammarCourse) return privateNoStoreJson({ catalog });

  const existingStaticCourse = catalog.courses.find(
   (course) => course.id === studioGrammarCourseId,
  );
  const withoutStaticCourse = catalog.courses.filter(
   (course) => course.id !== studioGrammarCourseId,
  );
  const withoutStaticBooks = catalog.books.filter(
   (book) => book.courseId !== studioGrammarCourseId,
  );
  const withoutStaticLessons = catalog.lessons.filter(
   (lesson) => lesson.courseId !== studioGrammarCourseId,
  );

  return privateNoStoreJson({
   catalog: {
    ...catalog,
    courses: [...withoutStaticCourse, staticGrammarCourse.course],
    books: [...withoutStaticBooks, ...staticGrammarCourse.books],
    lessons: includeLessons
     ? [...withoutStaticLessons, ...staticGrammarCourse.lessons]
     : withoutStaticLessons,
    meta: {
     ...catalog.meta,
     sourceFiles: [
      ...catalog.meta.sourceFiles,
      "src/features/hanzihome/static-json/studio-seed.json",
     ],
     counts: {
      ...catalog.meta.counts,
      lessons:
       catalog.meta.counts.lessons -
       (existingStaticCourse?.stats.lessonCount ?? 0) +
       staticGrammarCourse.course.stats.lessonCount,
      vocab:
       catalog.meta.counts.vocab -
       (existingStaticCourse?.stats.vocabCount ?? 0) +
       staticGrammarCourse.course.stats.vocabCount,
      grammarPoints:
       catalog.meta.counts.grammarPoints -
       (existingStaticCourse?.stats.grammarCount ?? 0) +
       staticGrammarCourse.course.stats.grammarCount,
     },
    },
   },
  });
 } catch {
  return apiError("Could not load HanziHome catalog", 503, "CATALOG_UNAVAILABLE");
 }
}
