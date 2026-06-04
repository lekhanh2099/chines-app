export type LessonRouteSummary = {
 id: string;
 lessonNumber: number;
};

export function getLessonRouteValue(lessonNumber: number) {
 return String(lessonNumber);
}

export function findLessonByRouteParam<TLesson extends LessonRouteSummary>(
 lessons: TLesson[],
 lessonParam: string | null | undefined,
 legacyLessonIdParam?: string | null,
) {
 return (
  lessons.find((lesson) => getLessonRouteValue(lesson.lessonNumber) === lessonParam) ||
  lessons.find((lesson) => lesson.id === legacyLessonIdParam) ||
  null
 );
}

export function buildHanziHomeLessonHref({
 courseId,
 lessonNumber,
 module,
}: {
 courseId: string;
 lessonNumber?: number | null;
 module?: string | null;
}) {
 const params = new URLSearchParams();
 params.set("courseId", courseId);

 if (typeof lessonNumber === "number") {
  params.set("lesson", getLessonRouteValue(lessonNumber));
 }

 if (module) {
  params.set("module", module);
 }

 return `/hanzihome?${params.toString()}`;
}
