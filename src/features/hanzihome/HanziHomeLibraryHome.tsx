"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, FileCode2, GraduationCap, LibraryBig, Rows3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CourseCard } from "@/features/hanzihome/components/library/CourseCard";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import type { CourseStats } from "@/features/hanzihome/components/library/types";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

export function HanziHomeLibraryHome() {
 const [editMode, setEditMode] = useState(false);
 const catalogData = useHanziHomeCatalogData();
 const canEdit = useHanziHomeCanEdit();
 const courses = catalogData.courses;
 const books = catalogData.books;
 const libraryStats = useMemo(() => getLibraryStats(courses, books), [books, courses]);

 return (
  <main className="flex w-full flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
   <section className="grid gap-5">
    <PageHeader
     title="Thư viện học HanziHome"
     description="Chọn giáo trình và bài học để đọc bài khóa, học từ vựng, nắm ngữ pháp và ôn tập."
     actions={
      <>
       <Button type="button" variant="outline" asChild>
        <Link href="/hanzihome/html-artifacts" prefetch={false}>
         <FileCode2 className="h-4 w-4" />
         Tệp HTML
        </Link>
       </Button>
       {canEdit ? (
        <HanziHomeLibraryCrudToolbar
         courses={courses}
         books={books}
         editMode={editMode}
         onEditModeChange={setEditMode}
        />
       ) : null}
      </>
     }
    />

    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
     <LibraryStat icon={LibraryBig} label="Khóa học" value={libraryStats.courseCount} />
     <LibraryStat icon={Rows3} label="Quyển" value={libraryStats.bookCount} />
     <LibraryStat icon={BookOpen} label="Bài học" value={libraryStats.lessonCount} />
     <LibraryStat icon={GraduationCap} label="Điểm ngữ pháp" value={libraryStats.grammarCount} />
    </div>

    {courses.length === 0 ? (
     <Card variant="glass" padding="lg">
      <p className=" font-semibold text-text-muted">Chưa tìm thấy khóa học trong HanziHome.</p>
     </Card>
    ) : (
     <section className="grid gap-3" aria-labelledby="course-library-heading">
      <div className="flex items-end justify-between gap-3">
       <div className="min-w-0 grid gap-1">
        <h2 id="course-library-heading" className="text-base font-black text-text-primary">
         Giáo trình đang học
        </h2>
        <p className="text-sm font-medium text-text-secondary">
         Mở nhanh bài gần nhất hoặc chọn bài cụ thể trong từng giáo trình.
        </p>
       </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-2">
      {courses.map((course) => (
       <CourseCard
        key={course.id}
        course={course}
        stats={getCourseStats(course, books)}
        editMode={canEdit && editMode}
       />
      ))}
     </div>
     </section>
    )}
   </section>
  </main>
 );
}

function LibraryStat({
 icon: Icon,
 label,
 value,
}: {
 icon: typeof LibraryBig;
 label: string;
 value: number;
}) {
 return (
  <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border-default/80 bg-bg-card px-3 py-2.5 shadow-theme-sm sm:gap-3 sm:px-4 sm:py-3">
   <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text sm:h-9 sm:w-9">
    <Icon className="h-4 w-4" />
   </span>
   <div className="min-w-0 grid gap-1">
    <p className="text-lg font-black leading-none text-text-primary sm:text-xl">{value}</p>
    <p className="truncate text-xs font-bold text-text-secondary">{label}</p>
   </div>
  </div>
 );
}

function getLibraryStats(courses: HanziHomeCatalogCourse[], books: HanziHomeCourseBook[]) {
 return {
  courseCount: courses.length,
  bookCount: books.length,
  lessonCount: courses.reduce((sum, course) => sum + course.stats.lessonCount, 0),
  grammarCount: courses.reduce((sum, course) => sum + course.stats.grammarCount, 0),
 };
}

function getCourseStats(course: HanziHomeCatalogCourse, books: HanziHomeCourseBook[]): CourseStats {
 return {
  books: books.filter((book) => book.courseId === course.id),
  lessonCount: course.stats.lessonCount,
  vocabCount: course.stats.vocabCount,
  grammarCount: course.stats.grammarCount,
  fallbackLessonId: course.fallbackLessonId || course.lastLessonId,
 };
}
