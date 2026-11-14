"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { Label } from "@/components/ui/forms/label";
import { Card } from "@/components/ui/layout/card";
import { FilterSelect } from "@/features/hanzihome/components/aggregate-library/FilterSelect";
import type {
 AggregateFilters,
 AggregateKind,
} from "@/features/hanzihome/repositories/hanzihome-content-resources";
import type {
 HanziHomeCatalogCourse,
 HanziHomeCourseBook,
 HanziHomeLesson,
} from "@/features/hanzihome/types";

export function AggregateFiltersCard({
 kind,
 filters,
 courses,
 books,
 lessons,
 hasActiveFilters,
 onFilterChange,
 onReset,
}: {
 kind: AggregateKind;
 filters: AggregateFilters;
 courses: HanziHomeCatalogCourse[];
 books: HanziHomeCourseBook[];
 lessons: HanziHomeLesson[];
 hasActiveFilters: boolean;
 onFilterChange: (key: keyof AggregateFilters, value: string) => void;
 onReset: () => void;
}) {
 const t = useTranslations("Vocab");

 return (
  <Card variant="section" padding="md" className="sticky top-0 z-20">
   <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1.2fr)_repeat(3,minmax(9rem,0.8fr))_auto] xl:items-end">
    <Label variant="label" className="grid gap-1.5">
     <Typography variant="overline" tone="muted" weight="black">
      {t("search.label")}
     </Typography>
     <div className="relative min-w-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      <Input
       value={filters.q}
       onChange={(event) => onFilterChange("q", event.target.value)}
       aria-label={kind === "vocab" ? t("search.vocabAria") : t("search.grammarAria")}
       placeholder={
        kind === "vocab" ? t("search.vocabPlaceholder") : t("search.grammarPlaceholder")
       }
       adornment="start"
      />
     </div>
    </Label>

    <FilterSelect
     label={t("filters.course")}
     value={filters.courseId}
     onChange={(value) => onFilterChange("courseId", value)}
     options={courses.map((course) => ({
      value: course.id,
      label: course.title,
     }))}
    />

    <FilterSelect
     label={t("filters.book")}
     value={filters.bookId}
     onChange={(value) => onFilterChange("bookId", value)}
     options={books.map((book) => ({
      value: book.id,
      label: book.shortTitle || book.title,
     }))}
    />

    <FilterSelect
     label={t("filters.lesson")}
     value={filters.lessonId}
     onChange={(value) => onFilterChange("lessonId", value)}
     options={lessons.map((lesson) => ({
      value: lesson.id,
      label: t("filters.lessonOption", {
       number: lesson.lessonNumber,
       title: lesson.titleZh,
      }),
     }))}
    />

    <Button
     type="button"
     onClick={onReset}
     disabled={!hasActiveFilters}
     variant="outline"
     size="toolbar"
    >
     {t("filters.reset")}
    </Button>
   </div>
  </Card>
 );
}
