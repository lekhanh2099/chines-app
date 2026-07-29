"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
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
     <StudyInstructionText
      as="span"
      tone="accent"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle"
     >
      <GroupIcon className="size-5" />
     </StudyInstructionText>
     <div className="min-w-0">
      <StudyInstructionText
       variant="overline"
       tone="accent"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Bộ giáo trình
      </StudyInstructionText>
      <div className="flex flex-wrap items-center gap-2">
       <Typography
        as="h3"
        variant="cardTitle"
        id={`${group.key}-collection-heading`}
        tone="default"
        weight="black"
       >
        {group.title}
       </Typography>
       {group.isDraft ? <Badge variant="warning">Dữ liệu nháp</Badge> : null}
       {group.key === "boyaSecondEdition" ? (
        <Badge variant="warning">Thiếu Cao cấp III</Badge>
       ) : null}
      </div>
      <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
       {group.description}
      </StudyInstructionText>
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
          <StudyInstructionText
           as="span"
           tone="accent"
           className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-primary shadow-theme-sm"
          >
           <BookOpenCheck className="size-4" />
          </StudyInstructionText>
          <div className="min-w-0">
           <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" size="sm">
             Cấp {courseIndex + 1}/{group.courses.length}
            </Badge>
            <Typography
             as="h4"
             variant="cardTitle"
             id={`${course.id}-heading`}
             tone="default"
             weight="black"
            >
             {course.title}
            </Typography>
            {editMode ? <CourseCrudActions course={course} /> : null}
           </div>
           {course.subtitle ? (
            <StudyInstructionText
             variant="caption"
             tone="muted"
             weight="semibold"
             className="mt-0.5"
            >
             {course.subtitle}
            </StudyInstructionText>
           ) : null}
          </div>
         </div>
         <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
          <Badge variant="default" size="sm">
           {courseBooks.length} quyển
          </Badge>
          <StudyInstructionText variant="caption" tone="muted" weight="bold">
           {course.stats.lessonCount} bài
          </StudyInstructionText>
         </div>
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
         <StudyInstructionText
          variant="bodySmall"
          tone="muted"
          weight="semibold"
          className="rounded-xl border border-dashed border-border-default bg-bg-primary px-3 py-2"
         >
          Cấp độ này chưa có quyển học.
         </StudyInstructionText>
        )}
       </section>
      ),
     )}
    </div>
   ) : (
    <div className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-3">
     <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold">
      Bộ giáo trình này chưa có quyển học.
     </StudyInstructionText>
    </div>
   )}
  </Card>
 );
}
