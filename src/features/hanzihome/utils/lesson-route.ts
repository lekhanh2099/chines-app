export type LessonRouteSummary = {
 id: string;
 lessonNumber: number;
 bookId?: string;
};

export function getLessonRouteValue(lessonNumber: number) {
 return String(lessonNumber);
}

export function findLessonByRouteParam<TLesson extends LessonRouteSummary>(
 lessons: TLesson[],
 lessonParam: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
 legacyLessonIdParam?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
 bookIdParam?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
) {
 const scopedLessons = bookIdParam
  ? lessons.filter((lesson) => lesson.bookId === bookIdParam)
  : lessons;

 return (
  scopedLessons.find((lesson) => getLessonRouteValue(lesson.lessonNumber) === lessonParam) ||
  scopedLessons.find((lesson) => lesson.id === legacyLessonIdParam) ||
  null
 );
}

export function buildHanziHomeLessonHref({
 courseId,
 bookId,
 lessonNumber,
 module,
}: {
 courseId: string;
 bookId?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
 lessonNumber?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
 module?: z.infer<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}) {
 const params = new URLSearchParams();
 params.set("courseId", courseId);

 if (bookId) {
  params.set("bookId", bookId);
 }

 if (typeof lessonNumber === "number") {
  params.set("lesson", getLessonRouteValue(lessonNumber));
 }

 if (module) {
  params.set("module", module);
 }

 return `/hanzihome?${params.toString()}`;
}
import { z } from "zod";
