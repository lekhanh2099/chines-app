import { z } from "zod";

import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";

import {
 courseBookKeySchema,
 getCourseTextbookCatalog,
 type CourseBookKey,
} from "./textbook-catalog";
import legacyRoutesSeed from "./courses/legacy-routes.json";

const legacyRoutesSchema = z.object({
 courseBooks: z.array(z.object({ courseId: z.string(), bookKey: courseBookKeySchema })),
 lessons: z.array(
  z.object({
   legacyId: z.string(),
   bookKey: courseBookKeySchema,
   number: z.number().int().positive(),
  }),
 ),
});

/** Tabs of the textbook reader that replace the modules of the former course workspace. */
const tabByLegacyModule = new Map([
 ["overview", "overview"],
 ["lessonText", "text"],
 ["notes", "notes"],
 ["vocab", "vocab"],
 ["grammar", "grammar"],
 ["review", "review"],
 ["practice", "practice"],
]);

const _legacyRoutes: z.output<typeof legacyRoutesSchema>[] = [];
function legacyRoutes() {
 if (_legacyRoutes.length === 0) _legacyRoutes.push(legacyRoutesSchema.parse(legacyRoutesSeed));
 const [routes] = _legacyRoutes;
 return routes;
}

type ConvertedCourseLesson = { bookKey: CourseBookKey; number: number; title: string };
const _convertedLessons: Map<string, ConvertedCourseLesson>[] = [];

/**
 * The converted course lesson that replaced a lesson row of the former database
 * course; `null` when the id does not name a converted lesson.
 */
export function convertedCourseLesson(legacyLessonId: string): ConvertedCourseLesson | null {
 if (_convertedLessons.length === 0) {
  const catalog = getCourseTextbookCatalog();
  const lessons = new Map<string, ConvertedCourseLesson>();
  for (const entry of legacyRoutes()?.lessons ?? []) {
   const summary = catalog
    .find((book) => book.key === entry.bookKey)
    ?.lessons.find((lesson) => lesson.number === entry.number);
   if (summary) {
    lessons.set(entry.legacyId, {
     bookKey: entry.bookKey,
     number: entry.number,
     title: summary.title,
    });
   }
  }
  _convertedLessons.push(lessons);
 }
 const [lessons] = _convertedLessons;
 return lessons?.get(legacyLessonId) ?? null;
}

/**
 * The textbook route that replaces a URL of the former database course workspace
 * (`/hanzihome?courseId=…&bookId=…&lesson=…&module=…` or `?lessonId=<uuid>`);
 * `null` when the URL does not name a converted course.
 */
export function legacyCourseLessonHref(query: {
 courseId?: string;
 bookId?: string;
 lesson?: string;
 lessonId?: string;
 module?: string;
}): string | null {
 const routes = legacyRoutes();
 if (!routes) return null;
 const byLegacyId = routes.lessons.find((lesson) => lesson.legacyId === query.lessonId);
 const bookKeys = byLegacyId
  ? [byLegacyId.bookKey]
  : routes.courseBooks
     .filter((entry) => entry.bookKey === query.bookId || entry.courseId === query.courseId)
     .sort(
      (left, right) =>
       Number(right.bookKey === query.bookId) - Number(left.bookKey === query.bookId),
     )
     .map((entry) => entry.bookKey);
 // Keep the preference order: an explicit `bookId` is searched before the rest of its course.
 const catalog = getCourseTextbookCatalog();
 const books = bookKeys.flatMap((key) => catalog.filter((book) => book.key === key));
 const [firstBook] = books;
 if (!firstBook) return null;

 const requested = byLegacyId?.number ?? Number(query.lesson);
 const book = books.find((item) => item.lessons.some((lesson) => lesson.number === requested));
 const target = book ?? firstBook;
 const [firstLesson] = target.lessons;
 if (!firstLesson) return null;
 const href = buildTextbookHref(target.key, book ? requested : firstLesson.number);
 const tab = tabByLegacyModule.get(query.module ?? "");
 return tab ? `${href}&tab=${tab}` : href;
}
