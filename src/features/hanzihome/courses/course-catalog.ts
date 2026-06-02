import type {
  HanziHomeCourse,
  HanziHomeCourseBook,
} from "@/features/hanzihome/types";

export const DEFAULT_HANYU_COURSE_ID = "hanyu-q2";
export const HANYU_Q3_COURSE_ID = "hanyu-q3";

export const hanzihomeCourses: HanziHomeCourse[] = [
  {
   id: DEFAULT_HANYU_COURSE_ID,
    slug: "giao-trinh-han-ngu-quyen-2",
    title: "Giáo trình Hán ngữ Quyển 2",
    subtitle: "Dữ liệu tĩnh phục vụ ôn thi Hán ngữ Quyển 2",
    type: "hanyu",
    order: 1,
  },
  {
   id: HANYU_Q3_COURSE_ID,
   slug: "giao-trinh-han-ngu-quyen-3",
   title: "Giáo trình Hán ngữ Quyển 3",
   subtitle: "Dữ liệu tĩnh Quyển 3 Thượng và Hạ",
   type: "hanyu",
   order: 2,
  },
];

export const hanzihomeCourseBooks: HanziHomeCourseBook[] = [
  {
    id: "hanyu-q2-shang",
    courseId: DEFAULT_HANYU_COURSE_ID,
    title: "Giáo trình Hán ngữ 2 Thượng",
    shortTitle: "Quyển 2 Thượng",
    order: 1,
  },
  {
    id: "hanyu-q2-xia",
    courseId: DEFAULT_HANYU_COURSE_ID,
    title: "Giáo trình Hán ngữ 2 Hạ",
    shortTitle: "Quyển 2 Hạ",
    order: 2,
  },
  {
    id: "hanyu-q3-shang",
    courseId: HANYU_Q3_COURSE_ID,
    title: "Giáo trình Hán ngữ 3 Thượng",
    shortTitle: "Quyển 3 Thượng",
    order: 1,
  },
  {
    id: "hanyu-q3-xia",
    courseId: HANYU_Q3_COURSE_ID,
    title: "Giáo trình Hán ngữ 3 Hạ",
    shortTitle: "Quyển 3 Hạ",
    order: 2,
  },
];

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
