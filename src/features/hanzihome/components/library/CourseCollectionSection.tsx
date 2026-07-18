"use client";

import { BookCopy, BookOpenCheck, Headphones, LibraryBig, Shapes } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/features/hanzihome/components/library/CourseCard";
import { CourseCrudActions } from "@/features/hanzihome/components/library/CourseCrudActions";
import type {
 LibraryCourseGroup,
 LibraryCourseGroupKey,
} from "@/features/hanzihome/components/library/library-course-groups";
import type { HanziHomeCourseBook, HanziHomeLesson } from "@/features/hanzihome/types";

const groupIcons = {
 hanyu: LibraryBig,
 boya: BookCopy,
 boyaSecondEdition: BookCopy,
 listening: Headphones,
 other: Shapes,
} satisfies Record<LibraryCourseGroupKey, typeof LibraryBig>;

export function CourseCollectionSection({
 group,
 books,
 lessons,
 editMode,
}: {
 group: LibraryCourseGroup;
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 editMode: boolean;
}) {
 const GroupIcon = groupIcons[group.key];
 const coursesWithBooks = group.courses.map((course) => ({
  course,
  books: books
   .filter((book) => book.courseId === course.id)
   .toSorted((left, right) => left.order - right.order),
  lessons: lessons.filter((lesson) => lesson.courseId === course.id),
 }));
 const hasBooks = coursesWithBooks.some((entry) => entry.books.length > 0);

 return (
  <Card variant="glass" padding="none" className="grid gap-3 rounded-2xl p-3 sm:p-4">
   <header className="flex flex-col gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
     <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
      <GroupIcon className="size-5" />
     </span>
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-wide text-accent-text">Bộ giáo trình</p>
      <div className="flex flex-wrap items-center gap-2">
       <h3 id={`${group.key}-collection-heading`} className="text-lg font-black text-text-primary">
        {group.title}
       </h3>
       {group.isDraft ? <Badge variant="warning">Dữ liệu nháp</Badge> : null}
       {group.key === "boyaSecondEdition" ? (
        <Badge variant="warning">Thiếu Cao cấp III</Badge>
       ) : null}
      </div>
      <p className="text-sm font-medium text-text-muted">{group.description}</p>
     </div>
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-2">
     <Badge variant="purple">{group.courses.length} cấp độ</Badge>
     <Badge variant="default">
      {group.key === "boyaSecondEdition"
       ? `${group.bookCount}/5 quyển`
       : `${group.bookCount} quyển`}
     </Badge>
     <Badge variant="default">{group.lessonCount} bài</Badge>
    </div>
   </header>

   {hasBooks ? (
    <div className="grid gap-3" aria-labelledby={`${group.key}-collection-heading`}>
     {coursesWithBooks.map(
      ({ course, books: courseBooks, lessons: courseLessons }, courseIndex) => (
       <section
        key={course.id}
        aria-labelledby={`${course.id}-heading`}
        className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-2.5 sm:p-3"
       >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
         <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-primary text-accent-text shadow-theme-sm">
           <BookOpenCheck className="size-4" />
          </span>
          <div className="min-w-0">
           <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" size="sm">
             Cấp {courseIndex + 1}/{group.courses.length}
            </Badge>
            <h4 id={`${course.id}-heading`} className="text-base font-black text-text-primary">
             {course.title}
            </h4>
            {editMode ? <CourseCrudActions course={course} /> : null}
           </div>
           {course.subtitle ? (
            <p className="mt-0.5 text-xs font-semibold text-text-muted">{course.subtitle}</p>
           ) : null}
          </div>
         </div>
         <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
          <Badge variant="default" size="sm">
           {courseBooks.length} quyển
          </Badge>
          <span className="text-xs font-bold text-text-muted">{course.stats.lessonCount} bài</span>
         </div>
        </header>

        {courseBooks.length > 0 ? (
         <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {courseBooks.map((book, bookIndex) => (
           <CourseCard
            key={book.id}
            course={course}
            book={book}
            lessons={courseLessons}
            editMode={editMode}
            canMoveBookUp={bookIndex > 0}
            canMoveBookDown={bookIndex < courseBooks.length - 1}
           />
          ))}
         </div>
        ) : (
         <p className="rounded-xl border border-dashed border-border-default bg-bg-primary px-3 py-2 text-sm font-semibold text-text-muted">
          Cấp độ này chưa có quyển học.
         </p>
        )}
       </section>
      ),
     )}
    </div>
   ) : (
    <div className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-3">
     <p className="text-sm font-semibold text-text-muted">Bộ giáo trình này chưa có quyển học.</p>
    </div>
   )}
  </Card>
 );
}
