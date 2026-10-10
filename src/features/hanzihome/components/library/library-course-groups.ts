import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { z } from "zod";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";

export const LibraryCourseGroupKeySchema = z.enum([
 "hanyu",
 "boya",
 "boyaSecondEdition",
 "listening",
 "other",
]);
export type LibraryCourseGroupKey = z.infer<typeof LibraryCourseGroupKeySchema>;

export type LibraryCourseGroup = {
 key: LibraryCourseGroupKey;
 title: string;
 description: string;
 isDraft: boolean;
 courses: HanziHomeCatalogCourse[];
 bookCount: number;
 lessonCount: number;
};

const groupDetails: Record<
 LibraryCourseGroupKey,
 {
  title: LibraryCourseGroup["title"];
  description: LibraryCourseGroup["description"];
  isDraft: LibraryCourseGroup["isDraft"];
 }
> = {
 hanyu: {
  title: "Giáo trình Hán ngữ",
  description: "Học theo bộ Hán ngữ, từ quyển thấp đến quyển cao.",
  isDraft: false,
 },
 boya: {
  title: "Giáo trình Boya",
  description: "Lộ trình Boya được chia rõ theo từng cấp độ và tập.",
  isDraft: false,
 },
 boyaSecondEdition: {
  title: "Boya 9 quyển · Bản 2",
  description: "第二版 · hiện có 4/5 quyển Trung–Cao cấp; chưa có Cao cấp III.",
  isDraft: false,
 },
 listening: {
  title: "Giáo trình luyện nghe",
  description: "Bài nghe, luyện phản xạ và nghe chép theo từng quyển.",
  isDraft: false,
 },
 other: {
  title: "Giáo trình khác",
  description: "Các giáo trình bổ sung và nội dung tự tạo.",
  isDraft: false,
 },
};

const groupOrder: LibraryCourseGroupKey[] = [
 "hanyu",
 "boya",
 "boyaSecondEdition",
 "listening",
 "other",
];

export function groupLibraryCourses(
 courses: HanziHomeCatalogCourse[],
 books: HanziHomeCourseBook[],
): LibraryCourseGroup[] {
 const coursesByGroup = new Map<LibraryCourseGroupKey, HanziHomeCatalogCourse[]>();

 for (const course of courses) {
  const key = resolveCourseGroupKey(course);
  const groupedCourses = coursesByGroup.get(key) ?? [];
  groupedCourses.push(course);
  coursesByGroup.set(key, groupedCourses);
 }

 return groupOrder.flatMap((key) => {
  const groupedCourses = coursesByGroup.get(key);
  if (!groupedCourses?.length) return [];

  const sortedCourses = groupedCourses.toSorted((left, right) => left.order - right.order);
  const courseIds = new Set(sortedCourses.map((course) => course.id));

  return [
   {
    key,
    ...groupDetails[key],
    courses: sortedCourses,
    bookCount: books.filter((book) => courseIds.has(book.courseId)).length,
    lessonCount: sortedCourses.reduce((sum, course) => sum + course.stats.lessonCount, 0),
   },
  ];
 });
}

function resolveCourseGroupKey(course: HanziHomeCatalogCourse): LibraryCourseGroupKey {
 if (course.type === "listening") return "listening";
 if (course.id === "boya-nine-volume-second-edition") return "boyaSecondEdition";
 if (course.id.startsWith("boya-") || course.slug.startsWith("boya-")) return "boya";
 if (course.type === "hanyu") return "hanyu";
 return "other";
}

export function getLibraryStats(courses: HanziHomeCatalogCourse[], books: HanziHomeCourseBook[]) {
 return {
  courseCount: courses.length,
  bookCount: books.length,
  lessonCount: courses.reduce((sum, course) => sum + course.stats.lessonCount, 0),
  grammarCount: courses.reduce((sum, course) => sum + course.stats.grammarCount, 0),
 };
}

export function getLibraryCourseEntries(
 group: LibraryCourseGroup,
 books: HanziHomeCourseBook[],
 lessons: HanziHomeLesson[],
) {
 return group.courses.map((course) => ({
  course,
  books: books
   .filter((book) => book.courseId === course.id)
   .toSorted((left, right) => left.order - right.order),
  lessons: lessons.filter((lesson) => lesson.courseId === course.id),
 }));
}

export function getLibraryBookStudy(
 course: HanziHomeCatalogCourse,
 book: HanziHomeCourseBook,
 lessons: HanziHomeLesson[],
 selectedLessonId: HanziHomeLesson["id"],
) {
 const bookLessons = lessons.filter((lesson) => lesson.bookId === book.id);
 const selectedExists = bookLessons.some((lesson) => lesson.id === selectedLessonId);
 const effectiveLessonId = (selectedExists ? selectedLessonId : null) || bookLessons[0]?.id || "";
 const effectiveLesson = bookLessons.find((lesson) => lesson.id === effectiveLessonId) ?? null;
 return {
  bookLessons,
  effectiveLesson,
  href: buildHanziHomeLessonHref({
   courseId: course.id,
   bookId: book.id,
   lessonNumber: effectiveLesson?.lessonNumber,
  }),
  visibleLessonCount: bookLessons.length,
  visibleVocabCount: bookLessons.reduce(
   (sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocabIds.length),
   0,
  ),
  visibleGrammarCount: bookLessons.reduce(
   (sum, lesson) => sum + (lesson.grammarCount ?? lesson.grammarPointIds.length),
   0,
  ),
 };
}
