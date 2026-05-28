"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookMarked, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ForkSeedCourseButton } from "@/features/hanzihome/courses/ForkSeedCourseButton";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";

type SeedCatalogResponse = {
 source: "static";
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons?: HanziHomeLesson[];
};

async function fetchSeedCatalog() {
 const response = await fetch("/api/hanzihome/seed/catalog?includeLessons=1", {
  method: "GET",
  cache: "no-store",
  headers: {
   Accept: "application/json",
  },
 });

 if (!response.ok) {
  throw new Error("Không tải được bộ học liệu mặc định");
 }

 return (await response.json()) as SeedCatalogResponse;
}

export function HanziHomeSeedLibrary() {
 const query = useQuery({
  queryKey: ["hanzihome", "seed-catalog"],
  queryFn: fetchSeedCatalog,
  staleTime: 0,
 });

 const courses = query.data?.courses ?? [];
 const books = query.data?.books ?? [];
 const lessons = query.data?.lessons ?? [];

 if (query.isLoading) {
  return (
   <main className="flex w-full max-w-full flex-col gap-4 px-4 py-4 lg:px-8">
    <Card padding="lg" className="rounded-xl">
     <p className="text-sm font-bold text-text-muted">
      Đang tải bộ học liệu mặc định...
     </p>
    </Card>
   </main>
  );
 }

 if (query.error) {
  return (
   <main className="flex w-full max-w-full flex-col gap-4 px-4 py-4 lg:px-8">
    <Card padding="lg" className="rounded-xl">
     <p className="text-sm font-bold text-destructive">
      {query.error.message}
     </p>
    </Card>
   </main>
  );
 }

 return (
  <main className="flex w-full max-w-full flex-col gap-4 px-4 py-4 lg:px-8">
   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
      HANZIHOME SEED
     </p>
     <h1 className="text-3xl font-black tracking-tight text-text-primary">
      Bộ học liệu mặc định
     </h1>
     <p className="max-w-3xl text-sm font-semibold text-text-secondary">
      Đây là dữ liệu gốc chỉ đọc. Muốn sửa, hãy tạo bản cá nhân để fork thành course thật trong DB.
     </p>
    </div>
   </Card>

   <section className="grid gap-4">
    {courses.map((course) => (
     <SeedCourseCard
      key={course.id}
      course={course}
      books={books.filter((book) => book.courseId === course.id)}
      lessons={lessons.filter((lesson) => lesson.courseId === course.id)}
     />
    ))}
   </section>
  </main>
 );
}

function SeedCourseCard({
 course,
 books,
 lessons,
}: {
 course: HanziHomeCatalogCourse;
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
}) {
 const defaultLessonId =
  course.fallbackLessonId || course.lastLessonId || lessons[0]?.id || "";
 const [selectedLessonId, setSelectedLessonId] = useState(defaultLessonId);

 const effectiveLessonId = useMemo(() => {
  return (
   lessons.find((lesson) => lesson.id === selectedLessonId)?.id ||
   defaultLessonId
  );
 }, [defaultLessonId, lessons, selectedLessonId]);

 const href = effectiveLessonId
  ? `/hanzihome?courseId=${course.id}&lessonId=${effectiveLessonId}`
  : `/hanzihome?courseId=${course.id}`;

 return (
  <Card padding="none" className="rounded-xl p-4">
   <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <div className="flex min-w-0 gap-4">
     <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle shadow-theme-sm">
      <BookMarked className="h-5 w-5" />
     </span>

     <div className="grid min-w-0 gap-1">
      <div className="flex flex-wrap items-center gap-2">
       <span className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
        {books[0]?.shortTitle || books[0]?.title || course.type}
       </span>
       <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-[0.7rem] font-black text-text-muted">
        Chỉ đọc
       </span>
      </div>

      <h2 className="truncate text-2xl font-black tracking-tight text-text-primary">
       {course.title}
      </h2>

      <p className="line-clamp-1 max-w-2xl text-sm font-semibold text-text-secondary">
       Dữ liệu seed từ JSON. Không sửa trực tiếp ở đây.
      </p>

      <div className="flex flex-wrap gap-2 pt-2">
       <MiniMetric label="Bài" value={course.stats.lessonCount} />
       <MiniMetric label="Từ" value={course.stats.vocabCount} />
       <MiniMetric label="Ngữ pháp" value={course.stats.grammarCount} />
      </div>

      {lessons.length > 0 && (
       <label className="mt-2 grid max-w-lg gap-1.5">
        <span className="text-xs font-black uppercase tracking-wide text-text-muted">
         Bài sẽ mở
        </span>
        <select
         value={effectiveLessonId}
         onChange={(event) => setSelectedLessonId(event.target.value)}
         className="h-10 rounded-xl border border-border-default bg-bg-input px-3 text-sm font-bold text-text-primary outline-none"
        >
         {lessons.map((lesson) => (
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
     <ForkSeedCourseButton courseId={course.id} />

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
