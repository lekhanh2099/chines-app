"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, BookOpenCheck, FileCode2, GraduationCap, LibraryBig, Rows3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import { CourseCard } from "@/features/hanzihome/components/library/CourseCard";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import { CourseCrudActions } from "@/features/hanzihome/components/library/CourseCrudActions";
import { RecentLearningCard } from "@/features/hanzihome/components/library/RecentLearningCard";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

export function HanziHomeLibraryHome() {
 const [editMode, setEditMode] = useState(false);
 const catalogQuery = useHanziHomeCatalogQuery();
 const catalogData = catalogQuery.data;
 const canEdit = useHanziHomeCanEdit();
 const courses = catalogData.courses;
 const books = catalogData.books;
 const libraryStats = useMemo(() => getLibraryStats(courses, books), [books, courses]);

 if (catalogQuery.isPending) return <HanziHomeLibrarySkeleton />;

 if (catalogQuery.isError) {
  return (
   <main className="w-full px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
    <QueryErrorCard
     title="Không tải được thư viện HanziHome"
     description="Dữ liệu giáo trình hiện không khả dụng. Hãy kiểm tra kết nối rồi thử lại."
     onRetry={() => void catalogQuery.refetch()}
    />
   </main>
  );
 }

 return (
  <main className="flex w-full flex-col gap-3 px-4 py-4 sm:px-6 md:h-full md:min-h-0 md:overflow-hidden lg:px-8 lg:py-5">
   <div className="grid shrink-0 gap-3">
    <section className="app-gradient-hero relative grid gap-3 overflow-hidden rounded-2xl border border-border-default p-4 shadow-theme-md">
     <PageHeader
      className="gap-3 [&_h1]:text-2xl [&_p]:mt-1 [&_p]:text-sm [&_p]:leading-5 [&_p]:text-text-primary/75"
      title="Thư viện học HanziHome"
      description="Chọn đúng giáo trình, quyển và bài bạn muốn học tiếp."
      actions={
       <>
        <Button type="button" variant="surfaceCard" asChild>
         <Link href="/html-artifacts" prefetch={false}>
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
      <LibraryStat icon={LibraryBig} label="Giáo trình" value={libraryStats.courseCount} />
      <LibraryStat icon={Rows3} label="Quyển" value={libraryStats.bookCount} />
      <LibraryStat icon={BookOpen} label="Bài học" value={libraryStats.lessonCount} />
      <LibraryStat icon={GraduationCap} label="Điểm ngữ pháp" value={libraryStats.grammarCount} />
     </div>
    </section>

    <RecentLearningCard courses={courses} books={books} />

    <div className="min-w-0 grid gap-0.5">
     <h2 id="course-library-heading" className="text-base font-black text-text-primary">
      Giáo trình đang học
     </h2>
     <p className="text-sm font-medium text-text-secondary">
      Chọn nhanh quyển và bài để tiếp tục học.
     </p>
    </div>
   </div>

   {courses.length === 0 ? (
     <Card variant="glass" padding="lg">
      <p className=" font-semibold text-text-muted">Chưa tìm thấy khóa học trong HanziHome.</p>
     </Card>
    ) : (
     <section
      className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto overscroll-contain pr-1 pb-1 scrollbar-soft"
      aria-labelledby="course-library-heading"
     >
       {courses.map((course) => {
        const courseBooks = books
         .filter((book) => book.courseId === course.id)
         .toSorted((left, right) => left.order - right.order);

        return (
         <section key={course.id} className="grid gap-1.5" aria-labelledby={`${course.id}-heading`}>
          <Card
           variant="glass"
           padding="sm"
           className="flex flex-wrap items-center justify-between gap-2 rounded-xl p-2"
          >
           <div className="flex min-w-0 items-center gap-2">
            <span className="app-brand-gradient flex size-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-theme-sm">
             <BookOpenCheck className="size-4" />
            </span>
            <div className="min-w-0">
             <div className="flex flex-wrap items-center gap-1.5">
              <h3 id={`${course.id}-heading`} className="truncate text-sm font-black text-text-primary sm:text-base">
               {course.title}
              </h3>
              <Badge variant="purple" size="sm">{courseBooks.length} quyển</Badge>
             </div>
             <p className="hidden truncate text-xs font-medium text-text-muted sm:block">
              {course.subtitle || `${course.stats.lessonCount} bài học trong giáo trình này`}
             </p>
            </div>
           </div>
           <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">{course.stats.lessonCount} bài</Badge>
            {canEdit && editMode ? <CourseCrudActions course={course} /> : null}
           </div>
          </Card>

          <div className="grid gap-2 lg:grid-cols-2">
           {courseBooks.map((book, index) => (
            <CourseCard
             key={book.id}
             course={course}
             book={book}
             editMode={canEdit && editMode}
             canMoveBookUp={index > 0}
             canMoveBookDown={index < courseBooks.length - 1}
            />
           ))}
          </div>
         </section>
        );
       })}
     </section>
    )}
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
  <div className="app-glass-surface flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 shadow-theme-sm">
   <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
    <Icon className="h-4 w-4" />
   </span>
   <div className="min-w-0 grid gap-1">
    <p className="text-base font-black leading-none text-text-primary sm:text-lg">{value}</p>
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
