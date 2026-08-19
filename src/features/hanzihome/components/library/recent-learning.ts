import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
 HanziHomeModule,
} from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

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
  href: buildHanziHomeLessonHref({
   courseId: course.id,
   bookId: lesson.bookId,
   lessonNumber: lesson.lessonNumber,
   module,
  }),
 };
}
