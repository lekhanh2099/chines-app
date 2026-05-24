"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateCourseDialog } from "@/features/hanzihome/courses/CreateCourseDialog";
import { useCustomHanziHomeCourseCatalogQuery } from "@/features/hanzihome/courses/use-custom-courses";
import {
 CreateLessonDraftDialog,
 mapLessonDraftToHanziHomeLesson,
 useLessonDraftsQuery,
} from "@/features/hanzihome/lesson-drafts";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

type CourseStats = {
 books: HanziHomeCourseBook[];
 lessonCount: number;
 vocabCount: number;
 grammarCount: number;
 fallbackLessonId?: string;
 suggestedLessonNumber: number;
};

export function HanziHomeLibraryHome() {
 const catalogData = useHanziHomeCatalogData();
 const customCatalogQuery = useCustomHanziHomeCourseCatalogQuery();
 const draftsQuery = useLessonDraftsQuery();

 const publishedDraftLessons = useMemo(
  () =>
   (draftsQuery.data ?? [])
    .filter((draft) => draft.status === "published")
    .map(mapLessonDraftToHanziHomeLesson),
 [draftsQuery.data],
 );

 const courses = useMemo(
  () =>
   mergeCatalogCourses(
    catalogData.courses,
    customCatalogQuery.data?.courses ?? [],
   ),
  [catalogData.courses, customCatalogQuery.data?.courses],
 );
 const books = useMemo(
  () =>
   mergeBooks(catalogData.books, customCatalogQuery.data?.books ?? []),
  [catalogData.books, customCatalogQuery.data?.books],
 );

 return (
  <main className="flex w-full max-w-full flex-col gap-3 px-4 py-4 lg:px-8">
   <section className="flex flex-wrap items-end justify-between gap-4">
    <div className="grid max-w-3xl gap-3">
     <p className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">
      HanziHome Library
     </p>

     <h1 className="text-4xl font-black tracking-tight text-text-primary md:text-5xl">
      Chọn bộ học liệu
     </h1>

     <p className="text-base font-semibold leading-relaxed text-text-secondary">
      Vào từng course để học theo bài. Tạo bài mới ở đúng course, rồi sửa từ
      vựng, ngữ pháp và bài khóa trong workspace.
     </p>
    </div>

    <CreateCourseDialog />
   </section>

   <section className="grid gap-4">
    {customCatalogQuery.isLoading && (
     <p className="text-sm font-bold text-text-muted">
      Đang tải custom course...
     </p>
    )}

    <div className="grid gap-4">
     {courses.map((course) => (
      <CourseCard
       key={course.id}
       course={course}
       stats={getCourseStats(course, publishedDraftLessons, books)}
      />
     ))}
    </div>
   </section>
  </main>
 );
}

function mergeCatalogCourses(
 catalogCourses: HanziHomeCatalogCourse[],
 customCourses: Array<Omit<HanziHomeCatalogCourse, "stats">>,
) {
 const byId = new Map<string, HanziHomeCatalogCourse>();

 for (const course of catalogCourses) {
  byId.set(course.id, course);
 }

 for (const course of customCourses) {
  if (!byId.has(course.id)) {
   byId.set(course.id, {
    ...course,
    stats: {
     bookCount: 0,
     lessonCount: 0,
     vocabCount: 0,
     grammarCount: 0,
    },
   });
  }
 }

 return Array.from(byId.values()).sort(
  (a, b) => a.order - b.order || a.title.localeCompare(b.title),
 );
}

function mergeBooks(
 catalogBooks: HanziHomeCourseBook[],
 customBooks: HanziHomeCourseBook[],
) {
 const byId = new Map<string, HanziHomeCourseBook>();

 for (const book of catalogBooks) {
  byId.set(book.id, book);
 }

 for (const book of customBooks) {
  if (!byId.has(book.id)) {
   byId.set(book.id, book);
  }
 }

 return Array.from(byId.values()).sort(
  (a, b) =>
   a.courseId.localeCompare(b.courseId) ||
   a.order - b.order ||
   a.title.localeCompare(b.title),
 );
}

function getCourseStats(
 course: HanziHomeCatalogCourse,
 publishedDraftLessons: HanziHomeLesson[],
 books: HanziHomeCourseBook[],
): CourseStats {
 const courseDraftLessons = publishedDraftLessons.filter(
  (lesson) => lesson.courseId === course.id,
 );
 const courseBooks = books.filter((book) => book.courseId === course.id);
 const maxDraftLessonNumber = courseDraftLessons
  .map((lesson) => lesson.lessonNumber)
  .filter((value): value is number => typeof value === "number")
  .reduce((max, value) => Math.max(max, value), 0);

 return {
  books: courseBooks,
  lessonCount: course.stats.lessonCount + courseDraftLessons.length,
  vocabCount:
   course.stats.vocabCount +
   courseDraftLessons.reduce(
   (sum, lesson) => sum + lesson.vocab.length,
   0,
  ),
  grammarCount:
   course.stats.grammarCount +
   courseDraftLessons.reduce(
   (sum, lesson) => sum + lesson.grammar.length,
   0,
  ),
  fallbackLessonId:
   courseDraftLessons.at(-1)?.id || course.fallbackLessonId || course.lastLessonId,
  suggestedLessonNumber:
   Math.max(course.stats.lessonCount, maxDraftLessonNumber) + 1,
 };
}

function CourseCard({
 course,
 stats,
}: {
 course: HanziHomeCatalogCourse;
 stats: CourseStats;
}) {
 const router = useRouter();
 const primaryBook = stats.books[0];

 const learning = useLearningState();
 const targetLessonId =
  learning.state.settings.lastCourseId === course.id
   ? learning.state.settings.lastLessonId || stats.fallbackLessonId
   : stats.fallbackLessonId;
 const href = targetLessonId
  ? `/hanzihome?courseId=${course.id}&lessonId=${targetLessonId}`
  : `/hanzihome?courseId=${course.id}`;

 const openCourse = () => {
  router.push(href);
 };

 return (
  <Card
   padding="none"
   role="button"
   tabIndex={0}
   onClick={openCourse}
   onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
     event.preventDefault();
     openCourse();
    }
   }}
   className="group cursor-pointer rounded-3xl p-5 transition-colors hover:border-accent-muted hover:bg-accent-subtle"
  >
   <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-subtle shadow-theme-sm transition-colors group-hover:bg-bg-primary">
      <BookMarked className="h-5 w-5" />
     </span>

     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <span className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
        {primaryBook?.shortTitle || primaryBook?.title || course.type}
       </span>

       {stats.books.length > 0 && (
        <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-[0.7rem] font-black text-text-muted">
         {stats.books.length} quyển
        </span>
       )}
      </div>

      <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-text-primary">
       {course.title}
      </h2>

      {course.subtitle && (
       <p className="mt-1 line-clamp-1 max-w-2xl text-sm font-semibold text-text-secondary">
        {course.subtitle}
      </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
       <MiniMetric label="Bài" value={stats.lessonCount} />
       <MiniMetric label="Từ" value={stats.vocabCount} />
       <MiniMetric label="Ngữ pháp" value={stats.grammarCount} />
      </div>
     </div>
    </div>

    <div
     className="flex flex-wrap gap-2 md:justify-end"
     onClick={(event) => event.stopPropagation()}
     onMouseDown={(event) => event.stopPropagation()}
    >
     <CreateLessonDraftDialog
      suggestedLessonNumber={stats.suggestedLessonNumber}
      courses={[course]}
      books={stats.books}
      selectedCourseId={course.id}
      selectedBookId={primaryBook?.id}
      triggerVariant="outline"
     />

     <Button asChild>
      <Link href={href}>
       <Sparkles className="h-4 w-4" />
       Vào học
      </Link>
     </Button>
    </div>
   </div>
  </Card>
 );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
 return (
  <span className="rounded-2xl border border-border-default bg-bg-subtle px-3 py-2">
   <span className="text-base font-black text-text-primary">{value}</span>
   <span className="ml-1 text-xs font-black text-text-muted">{label}</span>
  </span>
 );
}
