export function sortLessonsByCourseBookOrder<
 T extends {
  courseId?: string;
  bookOrder?: number;
  lessonOrder?: number;
  lessonNumber: number;
 },
>(lessons: T[]): T[] {
 return [...lessons].sort((a, b) => {
  const courseCompare = (a.courseId ?? "").localeCompare(b.courseId ?? "");

  if (courseCompare !== 0) return courseCompare;

  const bookCompare = (a.bookOrder ?? 9999) - (b.bookOrder ?? 9999);

  if (bookCompare !== 0) return bookCompare;

  return (a.lessonOrder ?? a.lessonNumber) - (b.lessonOrder ?? b.lessonNumber);
 });
}
