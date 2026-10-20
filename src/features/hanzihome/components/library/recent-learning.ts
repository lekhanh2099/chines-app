import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
 HanziHomeModule,
 UserLearningState,
} from "@/features/hanzihome/types";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { parseHanziHomeModule, resolveLessonModule } from "@/features/hanzihome/workspace-modules";

export function resolveRecentLearning({
 courses,
 books,
 lessons,
 courseId,
 lessonId,
 module,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 courseId: string;
 lessonId?: string;
 module: HanziHomeModule;
}) {
 const lesson = lessons.find((item) => item.id === lessonId);
 const course = courses.find((item) => item.id === courseId);

 if (!lesson || !course || lesson.courseId !== course.id) return null;

 const book = books.find((item) => item.id === lesson.bookId && item.courseId === course.id);

 return {
  lesson,
  course,
  book,
  module,
  href: buildHanziHomeLessonHref({
   courseId: course.id,
   bookId: lesson.bookId,
   lessonNumber: lesson.lessonNumber,
   module,
  }),
 };
}

export function resolveLibraryResumes({
 courses,
 books,
 lessons,
 textbooks,
 settings,
}: {
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 textbooks: TextbookBookSummary[];
 settings: UserLearningState["settings"];
}) {
 const catalog = books.flatMap((book) => {
  const resume = settings.bookResume?.[lessonBookKey({ bookId: book.id, courseId: book.courseId })];
  const lesson = lessons.find((item) => item.id === resume?.lessonId && item.bookId === book.id);
  if (!lesson) return [];
  const recent = resolveRecentLearning({
   courses,
   books,
   lessons,
   courseId: book.courseId,
   lessonId: lesson.id,
   module: resolveLessonModule({
    requestedModule: parseHanziHomeModule(resume?.module) ?? "overview",
    isListeningLesson: lesson.tags?.includes("listening") ?? false,
   }),
  });
  return recent ? [recent] : [];
 });
 const lastLearning = resolveRecentLearning({
  courses,
  books,
  lessons,
  courseId: settings.lastCourseId ?? "",
  lessonId: settings.lastLessonId,
  module: settings.lastModule ?? "overview",
 });
 if (
  lastLearning &&
  !settings.bookResume?.[lessonBookKey(lastLearning.lesson)] &&
  !catalog.some(
   (item) => item.course.id === lastLearning.course.id && item.book?.id === lastLearning.book?.id,
  )
 ) {
  catalog.unshift(lastLearning);
 }
 const recentTextbooks = textbooks.flatMap((book) => {
  const resume = settings.bookResume?.[`static:${book.id}`];
  const lesson = book.lessons.find((item) => item.id === resume?.lessonId);
  return lesson && resume ? [{ book, lesson, module: resume.module }] : [];
 });
 const order = [
  ...new Set([
   ...(settings.libraryResumeOrder ?? []),
   ...catalog.map((item) => lessonBookKey(item.lesson)),
   ...recentTextbooks.map((item) => `static:${item.book.id}`),
  ]),
 ];

 return { catalog, textbooks: recentTextbooks, order };
}
