"use client";

import { useState } from "react";

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

 return (
  <main className="flex w-full max-w-full flex-col gap-5 px-4 py-5 lg:px-8 lg:py-7">
   <section className="grid gap-5">
    <PageHeader
     title="Thư viện học HanziHome"
     description="Chọn giáo trình và bài học để đọc bài khóa, học từ vựng, nắm ngữ pháp và ôn tập."
     actions={
      canEdit ? (
       <HanziHomeLibraryCrudToolbar
        courses={courses}
        books={books}
        editMode={editMode}
        onEditModeChange={setEditMode}
       />
      ) : null
     }
    />

    {courses.length === 0 ? (
     <Card variant="glass" padding="lg">
      <p className=" font-semibold text-text-muted">Chưa tìm thấy khóa học trong HanziHome.</p>
     </Card>
    ) : (
     <div className="grid gap-4">
      {courses.map((course) => (
       <CourseCard
        key={course.id}
        course={course}
        stats={getCourseStats(course, books)}
        editMode={canEdit && editMode}
       />
      ))}
     </div>
    )}
   </section>
  </main>
 );
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
