"use client";

import { Card } from "@/components/ui/card";
import { CourseCard } from "@/features/hanzihome/components/library/CourseCard";
import type { CourseStats } from "@/features/hanzihome/components/library/types";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

export function HanziHomeLibraryHome() {
 const catalogData = useHanziHomeCatalogData();
 const courses = catalogData.courses;
 const books = catalogData.books;

 return (
  <main className="flex w-full max-w-full flex-col gap-3 px-4 py-4 lg:px-8">
   <section className="grid gap-4">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">HanziHome</p>
     <h1 className="text-2xl font-black tracking-tight text-text-primary">
      Thư viện ôn thi từ JSON tĩnh
     </h1>
     <p className="max-w-3xl  font-semibold leading-relaxed text-text-muted">
      Dữ liệu học chính đang đọc trực tiếp từ bộ JSON Quyển 2 trong source. Supabase chỉ còn dùng
      cho ghi chú cá nhân.
     </p>
    </div>

    {courses.length === 0 ? (
     <Card padding="lg" className="rounded-xl">
      <p className=" font-semibold text-text-muted">Chưa tìm thấy course tĩnh.</p>
     </Card>
    ) : (
     <div className="grid gap-4">
      {courses.map((course) => (
       <CourseCard key={course.id} course={course} stats={getCourseStats(course, books)} />
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
