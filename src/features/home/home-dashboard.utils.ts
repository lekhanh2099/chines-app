import { groupLibraryCourses } from "@/features/hanzihome/components/library/library-course-groups";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import type { HanziHomeCatalogData, UserLearningState } from "@/features/hanzihome/types";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { HomeCourseGroup } from "@/features/home/types";
import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { sortLessonsByCourseBookOrder } from "@/features/hanzihome/courses/course-catalog";
import {
 buildTextbookHref,
 lessonDisplayTitle,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { parseHanziHomeModule, resolveLessonModule } from "@/features/hanzihome/workspace-modules";
import {
 reviewAttemptAnswerSchema,
 type ReviewAttemptAnswer,
} from "@/features/hanzihome/practice/review-attempt";
import type { PracticeAttemptRow } from "@/features/hanzihome/practice/practice-attempt.schemas";
import type { HomeRecentActivityItem } from "@/features/home/types";

export type HomeReviewEvidence = {
 key: string;
 label: string;
 kindLabel: string;
 result: "again" | "hard" | "known";
 answeredAt: string;
};

export function projectHomeReviewEvidence(
 attempts: readonly PracticeAttemptRow[],
 labels: {
  fallback: Record<ReviewAttemptAnswer["itemType"], string>;
  kind: Record<ReviewAttemptAnswer["itemType"], string>;
 },
): HomeReviewEvidence[] {
 const evidence: HomeReviewEvidence[] = [];

 for (const attempt of attempts) {
  if (attempt.surface !== "review") continue;
  const parsed = reviewAttemptAnswerSchema.safeParse(attempt.answer);
  if (!parsed.success) continue;
  const answer = parsed.data;
  evidence.push({
   key: attempt.id,
   label: answer.label?.trim() || labels.fallback[answer.itemType],
   kindLabel: labels.kind[answer.itemType],
   result: answer.result,
   answeredAt: attempt.created_at,
  });
 }

 return evidence;
}

export function buildHomeRecentActivity(
 attempts: readonly PracticeAttemptRow[],
 labels: {
  fallback: Record<ReviewAttemptAnswer["itemType"], string>;
  kind: Record<ReviewAttemptAnswer["itemType"], string>;
 },
): HomeRecentActivityItem[] {
 return projectHomeReviewEvidence(attempts, labels).slice(0, 4);
}

export function buildHomeCourseGroups(
 catalog: HanziHomeCatalogData,
 textbooks: TextbookBookSummary[],
 settings: UserLearningState["settings"],
): HomeCourseGroup[] {
 const courseTargets: HomeCourseGroup[] = catalog.courses.map((course) => {
  const courseLessons = sortLessonsByCourseBookOrder(
   catalog.lessons.filter((lesson) => lesson.courseId === course.id),
  );
  const books = catalog.books
   .filter((book) => book.courseId === course.id)
   .toSorted((a, b) => a.order - b.order);
  return {
   id: course.id,
   title: course.title,
   books: (books.length
    ? books
    : [{ id: "", courseId: course.id, title: course.title, order: 0 }]
   ).map((book) => {
    const lessons = courseLessons.filter((lesson) => !book.id || lesson.bookId === book.id);
    const key = lessonBookKey({ bookId: book.id, courseId: course.id });
    const resume = settings.bookResume?.[key];
    const recent = lessons.find(
     (lesson) => lesson.id === (resume?.lessonId ?? settings.lastLessonId),
    );
    const lesson = recent ?? lessons[0];
    const activeModule = resolveLessonModule({
     requestedModule: recent
      ? (parseHanziHomeModule(resume?.module) ??
        (resume ? undefined : settings.lastModule) ??
        "overview")
      : "overview",
     isListeningLesson: lesson?.tags?.includes("listening") ?? false,
    });
    return {
     id: key,
     title: book.title,
     lesson: lesson
      ? {
         href: buildHanziHomeLessonHref({
          courseId: course.id,
          bookId: book.id || undefined,
          lessonNumber: lesson.lessonNumber,
          module: activeModule,
         }),
         title: lesson.title,
         titleZh: lesson.titleZh,
         courseTitle: course.title,
         lessonNumber: lesson.lessonNumber,
         module: activeModule,
         isRecent: Boolean(recent),
        }
      : null,
    };
   }),
  };
 });
 const groups: HomeCourseGroup[] = groupLibraryCourses(catalog.courses, catalog.books).map(
  (group) => ({
   id: group.key,
   title: group.title,
   books: group.courses.flatMap(
    (course) => courseTargets.find((target) => target.id === course.id)?.books ?? [],
   ),
  }),
 );

 for (const book of textbooks) {
  if (book.key === "tm2") continue;
  const key = `static:${book.id}`;
  const resume = settings.bookResume?.[key];
  const recent = book.lessons.find((lesson) => lesson.id === resume?.lessonId);
  const lesson = recent ?? book.lessons[0];
  const activeModule = recent ? (resume?.module ?? "all") : "all";
  groups.push({
   id: key,
   title: book.label,
   books: [
    {
     id: key,
     title: book.label,
     lesson: lesson
      ? {
         href: `${buildTextbookHref(book.key, lesson.number)}&tab=${encodeURIComponent(activeModule)}`,
         title: lessonDisplayTitle(lesson.title),
         titleZh: "",
         courseTitle: book.label,
         lessonNumber: lesson.number,
         module: activeModule,
         isRecent: Boolean(recent),
        }
      : null,
    },
   ],
  });
 }
 return groups;
}
