import type {
  HanziHomeCourse,
  HanziHomeCourseBook,
  HanziHomeLesson,
} from "@/features/hanzihome/types";

export const DEFAULT_HANYU_COURSE_ID = "hanyu-jiaocheng";
export const DEFAULT_HANYU_BOOK_ID = "hanyu-2";

export const hanzihomeCourses: HanziHomeCourse[] = [
  {
    id: DEFAULT_HANYU_COURSE_ID,
    slug: "giao-trinh-han-ngu",
    title: "Giáo trình Hán ngữ",
    subtitle: "Course mặc định cho dữ liệu HanziHome hiện tại",
    type: "hanyu",
    order: 1,
  },
];

export const hanzihomeCourseBooks: HanziHomeCourseBook[] = [
  {
    id: DEFAULT_HANYU_BOOK_ID,
    courseId: DEFAULT_HANYU_COURSE_ID,
    title: "Giáo trình Hán ngữ 2",
    shortTitle: "Hán ngữ 2",
    order: 2,
  },
];

export function withDefaultCourseMeta<T extends HanziHomeLesson>(
  lesson: T,
): T {
  return {
    ...lesson,
    courseId: lesson.courseId ?? DEFAULT_HANYU_COURSE_ID,
    courseTitle: lesson.courseTitle ?? "Giáo trình Hán ngữ",
    bookId: lesson.bookId ?? DEFAULT_HANYU_BOOK_ID,
    bookTitle: lesson.bookTitle ?? "Giáo trình Hán ngữ 2",
    bookOrder: lesson.bookOrder ?? 2,
    lessonOrder: lesson.lessonOrder ?? lesson.lessonNumber,
  };
}

export function sortLessonsByCourseBookOrder(
  lessons: HanziHomeLesson[],
): HanziHomeLesson[] {
  return [...lessons].sort((a, b) => {
    const courseCompare = (a.courseId ?? "").localeCompare(b.courseId ?? "");

    if (courseCompare !== 0) return courseCompare;

    const bookCompare = (a.bookOrder ?? 9999) - (b.bookOrder ?? 9999);

    if (bookCompare !== 0) return bookCompare;

    return (a.lessonOrder ?? a.lessonNumber) - (b.lessonOrder ?? b.lessonNumber);
  });
}


export function mergeCourseCatalogs({
  staticCourses,
  staticBooks,
  customCourses,
  customBooks,
}: {
  staticCourses: HanziHomeCourse[];
  staticBooks: HanziHomeCourseBook[];
  customCourses: HanziHomeCourse[];
  customBooks: HanziHomeCourseBook[];
}) {
  return {
    courses: [...staticCourses, ...customCourses].sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title),
    ),
    books: [...staticBooks, ...customBooks].sort(
      (a, b) =>
        a.courseId.localeCompare(b.courseId) ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    ),
  };
}
