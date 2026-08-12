"use client";

import { BookCopy, BookOpenCheck, Headphones, LibraryBig, Shapes } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
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
  <Card variant="section" padding="md" className="grid gap-4">
   <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
     <IconTile>
      <GroupIcon />
     </IconTile>
     <div className="grid min-w-0 gap-1">
      <Typography variant="overline" tone="accent" weight="black" tracking="wide">
       Bộ giáo trình
      </Typography>
      <div className="flex flex-wrap items-center gap-2">
       <Typography
        as="h3"
        variant="cardTitle"
        id={`${group.key}-collection-heading`}
        weight="black"
       >
        {group.title}
       </Typography>
       {group.isDraft ? <Badge variant="warning">Dữ liệu nháp</Badge> : null}
       {group.key === "boyaSecondEdition" ? (
        <Badge variant="warning">Thiếu Cao cấp III</Badge>
       ) : null}
      </div>
      <Typography as="p" variant="bodySmall" tone="muted">
       {group.description}
      </Typography>
     </div>
    </div>
    <Typography variant="caption" tone="muted" weight="bold" className="shrink-0 sm:pt-1">
     {group.courses.length} cấp độ · {group.bookCount} quyển · {group.lessonCount} bài
    </Typography>
   </header>

   <Separator />

   {hasBooks ? (
    <div className="grid gap-4" aria-labelledby={`${group.key}-collection-heading`}>
     {coursesWithBooks.map(
      ({ course, books: courseBooks, lessons: courseLessons }, courseIndex) => (
       <section key={course.id} aria-labelledby={`${course.id}-heading`} className="grid gap-3">
        {courseIndex > 0 ? <Separator /> : null}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
         <div className="flex min-w-0 items-start gap-2.5">
          <IconTile size="sm" tone="neutral">
           <BookOpenCheck />
          </IconTile>
          <div className="grid min-w-0 gap-0.5">
           <div className="flex flex-wrap items-center gap-2">
            <Typography variant="caption" tone="accent" weight="black">
             Cấp {courseIndex + 1}/{group.courses.length}
            </Typography>
            <Typography as="h4" variant="cardTitle" id={`${course.id}-heading`} weight="black">
             {course.title}
            </Typography>
            {editMode ? <CourseCrudActions course={course} /> : null}
           </div>
           {course.subtitle ? (
            <Typography as="p" variant="caption" tone="muted" weight="semibold">
             {course.subtitle}
            </Typography>
           ) : null}
          </div>
         </div>
         <Typography variant="caption" tone="muted" weight="bold" className="pl-10 sm:pl-0">
          {courseBooks.length} quyển · {course.stats.lessonCount} bài
         </Typography>
        </header>

        {courseBooks.length > 0 ? (
         <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
         <EmptyState
          size="compact"
          surface="subtle"
          align="start"
          title="Chưa có quyển học"
          description="Cấp độ này chưa có quyển được thêm vào thư viện."
         />
        )}
       </section>
      ),
     )}
    </div>
   ) : (
    <EmptyState
     size="compact"
     surface="subtle"
     title="Bộ giáo trình chưa có quyển học"
     description="Thêm quyển để bắt đầu tổ chức bài học trong bộ này."
    />
   )}
  </Card>
 );
}
