"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, FileCode2, GraduationCap, LibraryBig, Rows3 } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import { Typography } from "@/components/ui/typography";
import { CourseCollectionSection } from "@/features/hanzihome/components/library/CourseCollectionSection";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import { groupLibraryCourses } from "@/features/hanzihome/components/library/library-course-groups";
import { RecentLearningCard } from "@/features/hanzihome/components/library/RecentLearningCard";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

export function HanziHomeLibraryHome() {
 const [editMode, setEditMode] = useState(false);
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const catalogData = catalogQuery.data;
 const canEdit = useHanziHomeCanEdit();
 const courses = catalogData.courses;
 const books = catalogData.books;
 const lessons = catalogData.lessons;
 const libraryStats = useMemo(() => getLibraryStats(courses, books), [books, courses]);
 const courseGroups = useMemo(() => groupLibraryCourses(courses, books), [books, courses]);

 if (catalogQuery.isPending) return <HanziHomeLibrarySkeleton />;

 if (catalogQuery.isError) {
  return (
   <PageContainer>
    <QueryErrorCard
     title="Không tải được thư viện HanziHome"
     description="Dữ liệu giáo trình hiện không khả dụng. Hãy kiểm tra kết nối rồi thử lại."
     onRetry={() => void catalogQuery.refetch()}
    />
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <main className="grid w-full gap-6">
    <PageHeader
     title="Thư viện học HanziHome"
     description="Chọn giáo trình, cấp độ, quyển rồi mở đúng bài bạn muốn học."
     actions={
      <>
       <Button type="button" variant="outline" size="toolbar" asChild>
        <Link href="/html-artifacts" prefetch={false}>
         <FileCode2 data-icon="inline-start" />
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

    <Card variant="subtle" padding="sm">
     <div className="grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-4">
      <LibraryStat icon={LibraryBig} label="Giáo trình" value={libraryStats.courseCount} />
      <LibraryStat icon={Rows3} label="Quyển" value={libraryStats.bookCount} />
      <LibraryStat icon={BookOpen} label="Bài học" value={libraryStats.lessonCount} />
      <LibraryStat icon={GraduationCap} label="Điểm ngữ pháp" value={libraryStats.grammarCount} />
     </div>
    </Card>

    <RecentLearningCard courses={courses} books={books} lessons={lessons} />

    <section aria-labelledby="course-library-heading" className="grid gap-3">
     <div className="grid min-w-0 gap-1">
      <Typography as="h2" variant="sectionTitle" id="course-library-heading" weight="black">
       Các bộ giáo trình
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Mỗi bộ được chia theo cấp độ; quyển học là đơn vị tương tác cuối cùng để chọn bài.
      </Typography>
     </div>

     {courses.length === 0 ? (
      <EmptyState
       surface="subtle"
       title="Chưa có giáo trình"
       description="Dữ liệu khóa học chưa khả dụng trong thư viện HanziHome."
      />
     ) : (
      <div className="grid gap-4">
       {courseGroups.map((group) => (
        <CourseCollectionSection
         key={group.key}
         group={group}
         books={books}
         lessons={lessons}
         editMode={canEdit && editMode}
        />
       ))}
      </div>
     )}
    </section>
   </main>
  </PageContainer>
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
  <div className="flex min-w-0 items-center gap-2.5 px-2 py-1.5">
   <IconTile size="sm" tone="neutral">
    <Icon />
   </IconTile>
   <div className="grid min-w-0 gap-0.5">
    <Typography variant="cardTitle" weight="black" leading="none">
     {value}
    </Typography>
    <Typography variant="caption" tone="muted" weight="bold" clamp="one">
     {label}
    </Typography>
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
