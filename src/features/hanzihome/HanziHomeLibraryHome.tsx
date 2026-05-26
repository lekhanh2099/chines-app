"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookMarked, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateCourseDialog } from "@/features/hanzihome/courses/CreateCourseDialog";
import { useCustomHanziHomeCourseCatalogQuery } from "@/features/hanzihome/courses/use-custom-courses";
import {
 CreateLessonDraftDialog,
 type LessonDraftSummary,
 useLessonDraftSummariesQuery,
} from "@/features/hanzihome/lesson-drafts";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
} from "@/features/hanzihome/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";

function isCanonicalLessonWorkingCopy(draft: LessonDraftSummary) {
 return (
  draft.lessonKey.startsWith("seed-copy-") ||
  draft.lessonKey.startsWith("hanyu2-bai-") ||
  draft.lessonKey.startsWith("hanyu-") ||
  draft.lessonKey.startsWith("hsk-")
 );
}

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
 const draftsQuery = useLessonDraftSummariesQuery();
 const learning = useLearningState();

 const activeDrafts = useMemo(
  () =>
   (draftsQuery.data ?? []).filter(
    (draft) =>
     draft.status !== "archived" && !isCanonicalLessonWorkingCopy(draft),
   ),
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
  () => mergeBooks(catalogData.books, customCatalogQuery.data?.books ?? []),
  [catalogData.books, customCatalogQuery.data?.books],
 );

 return (
  <main className="flex w-full max-w-full flex-col gap-3 px-4 py-4 lg:px-8">
   <section className="flex gap-4 w-full">
    <div className="grid gap-3 w-full">
     <GlobalMemoryTipCard compact />
     <div className="flex justify-start xl:justify-end">
      <CreateCourseDialog />
     </div>
    </div>
   </section>

   <DraftRecoveryPanel
    drafts={activeDrafts}
    error={draftsQuery.error}
    isLoading={draftsQuery.isLoading}
   />

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
       stats={getCourseStats(course, books)}
       lastCourseId={learning.state.settings.lastCourseId}
       lastLessonId={learning.state.settings.lastLessonId}
      />
     ))}
    </div>
   </section>
  </main>
 );
}

function DraftRecoveryPanel({
 drafts,
 error,
 isLoading,
}: {
 drafts: LessonDraftSummary[];
 error: Error | null;
 isLoading: boolean;
}) {
 if (!isLoading && !error && drafts.length === 0) return null;

 const visibleDrafts = [...drafts]
  .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  .slice(0, 6);

 return (
  <Card padding="md" className="rounded-xl">
   <div className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">
       Bài nháp / cần publish
      </p>
      <h2 className="text-lg font-black text-text-primary">
       Tiếp tục soạn bài đang làm dở
      </h2>
      <p className="text-sm font-semibold text-text-muted">
       Draft không phải lesson học. Mở lại ở đây để soạn tiếp hoặc publish vào
       lesson DB.
      </p>
     </div>

     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {drafts.length} draft
     </span>
    </div>

    {isLoading && (
     <p className="text-sm font-bold text-text-muted">Đang tải bài nháp...</p>
    )}

    {error && (
     <p role="alert" className="text-sm font-bold text-destructive">
      {error.message}
     </p>
    )}

    {visibleDrafts.length > 0 && (
     <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {visibleDrafts.map((draft) => (
       <Link
        key={draft.id}
        href={`/hanzihome/drafts/${draft.id}`}
        className="grid gap-1 rounded-xl border border-border-default bg-bg-subtle p-3 transition-colors hover:border-accent-muted hover:bg-accent-subtle"
       >
        <p className="truncate text-sm font-black text-text-primary">
         {draft.lessonNumber ? `Bài ${draft.lessonNumber}: ` : ""}
         {draft.titleZh}
        </p>
        <p className="truncate text-xs font-semibold text-text-muted">
         {draft.bookTitle || draft.courseTitle || draft.lessonKey}{" "}
         · {draft.status}
        </p>
       </Link>
      ))}
     </div>
    )}

    {drafts.length > visibleDrafts.length && (
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Còn {drafts.length - visibleDrafts.length} draft khác. Mở draft gần đây
      nhất trước, hoặc dùng tìm kiếm sau khi build trang quản lý draft đầy đủ.
     </p>
    )}
   </div>
  </Card>
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
 books: HanziHomeCourseBook[],
): CourseStats {
 const courseBooks = books.filter((book) => book.courseId === course.id);

 return {
  books: courseBooks,
  lessonCount: course.stats.lessonCount,
  vocabCount: course.stats.vocabCount,
  grammarCount: course.stats.grammarCount,
  fallbackLessonId: course.fallbackLessonId || course.lastLessonId,
  suggestedLessonNumber: course.stats.lessonCount + 1,
 };
}

function CourseCard({
 course,
 stats,
 lastCourseId,
 lastLessonId,
}: {
 course: HanziHomeCatalogCourse;
 stats: CourseStats;
 lastCourseId?: string;
 lastLessonId?: string;
}) {
 const router = useRouter();
 const primaryBook = stats.books[0];
 const courseLessons = useHanziHomeCourseLessons(course.id);

 const targetLessonId =
  lastCourseId === course.id
   ? lastLessonId || stats.fallbackLessonId
   : stats.fallbackLessonId;
 const [selectedLessonId, setSelectedLessonId] = useState(targetLessonId ?? "");
 const selectedLessonIsAvailable = courseLessons.some(
  (lesson) => lesson.id === selectedLessonId,
 );
 const effectiveLessonId =
  (selectedLessonIsAvailable ? selectedLessonId : null) ||
  targetLessonId ||
  courseLessons.at(-1)?.id ||
  "";
 const href = effectiveLessonId
  ? `/hanzihome?courseId=${course.id}&lessonId=${effectiveLessonId}`
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
   className="group cursor-pointer rounded-xl p-4 transition-colors hover:border-accent-muted hover:bg-accent-subtle"
  >
   <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle shadow-theme-sm transition-colors group-hover:bg-bg-primary">
      <BookMarked className="h-5 w-5" />
     </span>

     <div className="grid min-w-0 gap-1">
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

      <h2 className="truncate text-2xl font-black tracking-tight text-text-primary">
       {course.title}
      </h2>

      {course.subtitle && (
       <p className="line-clamp-1 max-w-2xl text-sm font-semibold text-text-secondary">
        {course.subtitle}
       </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
       <MiniMetric label="Bài" value={stats.lessonCount} />
       <MiniMetric label="Từ" value={stats.vocabCount} />
       <MiniMetric label="Ngữ pháp" value={stats.grammarCount} />
      </div>

      {courseLessons.length > 0 && (
       <label
        className="mt-2 grid max-w-lg gap-1.5"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
       >
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bài sẽ mở
        </span>
        <select
         value={effectiveLessonId}
         onChange={(event) => setSelectedLessonId(event.target.value)}
         className="h-10 rounded-xl border border-border-default bg-bg-input px-3 text-sm font-bold text-text-primary outline-none"
        >
         {courseLessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
           {lesson.id === targetLessonId ? "Đang học · " : ""}
           Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
          </option>
         ))}
        </select>
       </label>
      )}
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
  <span className="inline-flex items-baseline gap-1 rounded-xl border border-border-default bg-bg-subtle px-3 py-2">
   <span className="text-base font-black text-text-primary">{value}</span>
   <span className="text-xs font-black text-text-muted">{label}</span>
  </span>
 );
}
