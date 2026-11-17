"use client";

import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Chip } from "@/components/ui/actions/chip";
import { Typography } from "@/components/ui/display/typography";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Input } from "@/components/ui/forms/input";
import { CourseCollectionSection } from "@/features/hanzihome/components/library/CourseCollectionSection";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { LibraryTextbookCollection } from "@/features/hanzihome/components/library/LibraryTextbookCollection";
import type { LibraryCourseGroup } from "@/features/hanzihome/components/library/library-course-groups";
import type { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";

type CourseCollectionSectionProps = ComponentProps<typeof CourseCollectionSection>;

export function LibrarySyncNotice({ learning }: { learning: ReturnType<typeof useLearningState> }) {
 const t = useTranslations("Common.library");
 const common = useTranslations("Common");

 return (
  <>
   {learning.pendingSyncCount > 0 && !learning.isError ? (
    <Typography as="p" variant="bodySmall" tone="muted" role="status">
     {common(
      learning.durability === "memory-only"
       ? "syncStatus.localSavePending"
       : learning.isOnline
         ? "syncStatus.syncing"
         : "syncStatus.durablySavedOffline",
     )}
    </Typography>
   ) : null}

   {learning.isError ? (
    <QueryErrorCard
     title={common(
      learning.durability === "failed" ? "syncStatus.localStorageFailed" : "syncStatus.syncError",
     )}
     description={t("orderSaveError")}
     retryLabel={common("actions.retry")}
     onRetry={() => void learning.retrySync()}
    />
   ) : null}
  </>
 );
}

export function LibrarySelectedCollection({
 selectedGroup,
 selectedTextbook,
 books,
 lessons,
 isCatalogError,
 isCatalogPending,
 onRetryCatalog,
}: {
 selectedGroup?: LibraryCourseGroup;
 selectedTextbook?: TextbookBookSummary;
 books: CourseCollectionSectionProps["books"];
 lessons: CourseCollectionSectionProps["lessons"];
 isCatalogError: boolean;
 isCatalogPending: boolean;
 onRetryCatalog: () => void;
}) {
 const t = useTranslations("Common.library");
 const common = useTranslations("Common");

 return (
  <>
   {isCatalogError ? (
    <QueryErrorCard
     title={t("loadErrorTitle")}
     description={t("loadErrorDescription")}
     retryLabel={common("actions.retry")}
     onRetry={onRetryCatalog}
    />
   ) : null}
   {selectedGroup ? (
    <CourseCollectionSection group={selectedGroup} books={books} lessons={lessons} />
   ) : selectedTextbook ? (
    <LibraryTextbookCollection textbook={selectedTextbook} />
   ) : isCatalogPending ? (
    <HanziHomeLibrarySkeleton />
   ) : !isCatalogError ? (
    <EmptyState
     surface="subtle"
     title={t("noMatchesTitle")}
     description={t("noMatchesDescription")}
    />
   ) : null}
  </>
 );
}

export function LibraryCollectionFilters({
 query,
 filter,
 onQueryChange,
 onFilterChange,
}: {
 query: string;
 filter: string;
 onQueryChange: (query: string) => void;
 onFilterChange: (filter: string) => void;
}) {
 const t = useTranslations("Common.library");
 const filters = [
  { value: "all", label: t("filters.all") },
  { value: "hanyu", label: t("filters.hanyu") },
  { value: "boya", label: t("filters.boya") },
  { value: "specialized", label: t("filters.specialized") },
 ];

 return (
  <>
   <div className="relative w-full sm:max-w-xs">
    <Search
     aria-hidden="true"
     className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
    />
    <Input
     type="search"
     adornment="start"
     density="search"
     value={query}
     onChange={(event) => onQueryChange(event.target.value)}
     placeholder={t("searchPlaceholder")}
     aria-label={t("searchPlaceholder")}
    />
   </div>
   <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterLabel")}>
    {filters.map((item) => (
     <Chip
      key={item.value}
      pressed={filter === item.value}
      variant={filter === item.value ? "accent" : "outline"}
      onClick={() => onFilterChange(item.value)}
     >
      {item.label}
     </Chip>
    ))}
   </div>
  </>
 );
}
