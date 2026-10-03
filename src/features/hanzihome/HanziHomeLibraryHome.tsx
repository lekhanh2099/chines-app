"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, FileCode2, GraduationCap, LibraryBig, Rows3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { PageHeader } from "@/components/ui/layout/page-header";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { CourseCollectionSection } from "@/features/hanzihome/components/library/CourseCollectionSection";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import { groupLibraryCourses } from "@/features/hanzihome/components/library/library-course-groups";
import { RecentLearningCard } from "@/features/hanzihome/components/library/RecentLearningCard";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import type { HanziHomeCatalogCourse, HanziHomeCourseBook } from "@/features/hanzihome/types";

export function HanziHomeLibraryHome() {
 const t = useTranslations("Common.library");
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
     title={t("loadErrorTitle")}
     description={t("loadErrorDescription")}
     onRetry={() => void catalogQuery.refetch()}
    />
   </PageContainer>
  );
 }

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-6">
    <PageHeader
     title={t("title")}
     description={t("description")}
     actions={
      <>
       <Button type="button" variant="outline" size="toolbar" asChild>
        <Link href="/html-artifacts">
         <FileCode2 data-icon="inline-start" />
         {t("htmlFiles")}
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
      <LibraryStat icon={LibraryBig} label={t("statCourse")} value={libraryStats.courseCount} />
      <LibraryStat icon={Rows3} label={t("statBook")} value={libraryStats.bookCount} />
      <LibraryStat icon={BookOpen} label={t("statLesson")} value={libraryStats.lessonCount} />
      <LibraryStat
       icon={GraduationCap}
       label={t("statGrammar")}
       value={libraryStats.grammarCount}
      />
     </div>
    </Card>

    <RecentLearningCard courses={courses} books={books} lessons={lessons} />

    <section aria-labelledby="course-library-heading" className="grid gap-3">
     <div className="grid min-w-0 gap-1">
      <Typography as="h2" variant="sectionTitle" id="course-library-heading" weight="black">
       {t("courseSeriesHeading")}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {t("courseSeriesDescription")}
      </Typography>
     </div>

     {courses.length === 0 ? (
      <EmptyState
       surface="subtle"
       title={t("noCoursesTitle")}
       description={t("noCoursesDescription")}
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
   </div>
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
