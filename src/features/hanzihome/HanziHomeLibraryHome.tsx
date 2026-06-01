"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMarked, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCourseLessons } from "@/features/hanzihome/hooks/useHanziHomeCourseLessons";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
} from "@/features/hanzihome/types";

type CourseStats = {
 books: HanziHomeCourseBook[];
 lessonCount: number;
 vocabCount: number;
 grammarCount: number;
 fallbackLessonId?: string;
};

export function HanziHomeLibraryHome() {
 const catalogData = useHanziHomeCatalogData();
 const courses = catalogData.courses;
 const books = catalogData.books;

 return (
  <main className="flex w-full max-w-full flex-col gap-3 px-4 py-4 lg:px-8">
   <section className="grid gap-4">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
      HanziHome
     </p>
     <h1 className="text-2xl font-black tracking-tight text-text-primary">
      Thư viện ôn thi từ JSON tĩnh
     </h1>
     <p className="max-w-3xl text-sm font-semibold leading-relaxed text-text-muted">
      Dữ liệu học chính đang đọc trực tiếp từ bộ JSON Quyển 2 trong source.
      Supabase chỉ còn dùng cho ghi chú cá nhân.
     </p>
    </div>

    {courses.length === 0 ? (
     <Card padding="lg" className="rounded-xl">
      <p className="text-sm font-semibold text-text-muted">
       Chưa tìm thấy course tĩnh.
      </p>
     </Card>
    ) : (
     <div className="grid gap-4">
      {courses.map((course) => (
       <CourseCard
        key={course.id}
        course={course}
        stats={getCourseStats(course, books)}
       />
      ))}
     </div>
    )}
   </section>
  </main>
 );
}

function getCourseStats(
 course: HanziHomeCatalogCourse,
 books: HanziHomeCourseBook[],
): CourseStats {
 return {
  books: books.filter((book) => book.courseId === course.id),
  lessonCount: course.stats.lessonCount,
  vocabCount: course.stats.vocabCount,
  grammarCount: course.stats.grammarCount,
  fallbackLessonId: course.fallbackLessonId || course.lastLessonId,
 };
}

function CourseCard({
 course,
 stats,
}: {
 course: HanziHomeCatalogCourse;
 stats: CourseStats;
}) {
 const primaryBook = stats.books[0];
 const courseLessons = useHanziHomeCourseLessons(course.id);
 const [selectedLessonId, setSelectedLessonId] = useState(
  stats.fallbackLessonId ?? "",
 );
 const effectiveLessonId = useMemo(() => {
  const selectedExists = courseLessons.some(
   (lesson) => lesson.id === selectedLessonId,
  );

  return (
   (selectedExists ? selectedLessonId : null) ||
   stats.fallbackLessonId ||
   courseLessons[0]?.id ||
   ""
  );
 }, [courseLessons, selectedLessonId, stats.fallbackLessonId]);
 const href = effectiveLessonId
  ? `/hanzihome?courseId=${course.id}&lessonId=${effectiveLessonId}`
  : `/hanzihome?courseId=${course.id}`;
 const visibleLessonCount = courseLessons.length || stats.lessonCount;
 const visibleVocabCount =
  courseLessons.length > 0
   ? courseLessons.reduce(
      (sum, lesson) => sum + (lesson.vocabCount ?? lesson.vocabIds.length),
      0,
     )
   : stats.vocabCount;
 const visibleGrammarCount =
  courseLessons.length > 0
   ? courseLessons.reduce(
      (sum, lesson) =>
       sum + (lesson.grammarCount ?? lesson.grammarPointIds.length),
      0,
     )
   : stats.grammarCount;

 return (
  <Card
   padding="none"
   className="rounded-xl p-4 transition-colors hover:border-accent-muted hover:bg-accent-subtle"
  >
   <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle shadow-theme-sm">
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
       <MiniMetric label="Bài" value={visibleLessonCount} />
       <MiniMetric label="Từ" value={visibleVocabCount} />
       <MiniMetric label="Ngữ pháp" value={visibleGrammarCount} />
      </div>

      {courseLessons.length > 0 && (
       <label className="mt-2 grid max-w-lg gap-1.5">
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
           Bài {lesson.lessonNumber}: {lesson.titleZh || lesson.title}
          </option>
         ))}
        </select>
       </label>
      )}
     </div>
    </div>

    <div className="flex flex-wrap gap-2 md:justify-end">
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
