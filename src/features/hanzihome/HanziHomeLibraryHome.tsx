"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { getAppScrollContainer } from "@/components/layout/scroll/app-scroll";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import { LibraryArrangeDialog } from "@/features/hanzihome/components/library/LibraryArrangeDialog";
import { LibraryCollectionCard } from "@/features/hanzihome/components/library/LibraryCollectionCard";
import {
 LibraryCollectionFilters,
 LibrarySelectedCollection,
 LibrarySyncNotice,
} from "@/features/hanzihome/components/library/LibraryHomeSections";
import {
 groupLibraryCourses,
 libraryCourseGroupCharacters,
 libraryTextbookCharacters,
} from "@/features/hanzihome/components/library/library-course-groups";
import {
 buildLibraryCollectionOrder,
 excludeHiddenLibraryCollections,
 filterLibraryGroups,
 filterLibraryTextbooks,
 filterVisibleLibraryCollectionIds,
} from "@/features/hanzihome/components/library/library-home-model";
import { LibraryCoverDialog } from "@/features/hanzihome/components/library/LibraryCoverDialog";
import { useLibraryCovers } from "@/features/hanzihome/components/library/useLibraryCovers";
import { resolveLibraryResumes } from "@/features/hanzihome/components/library/recent-learning";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { Link } from "@/i18n/navigation";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

export function HanziHomeLibraryHome({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const t = useTranslations("Common.library");
 const common = useTranslations("Common");
 const searchParams = useSearchParams();
 const learning = useLearningState();
 const isCoarsePointer = useCoarsePointer();
 const [editMode, setEditMode] = useState(false);
 const [filter, setFilter] = useState("all");
 const [query, setQuery] = useState("");
 const [editingCoverId, setEditingCoverId] = useState("");
 const coverMenuTrigger = useRef<HTMLButtonElement>(null);
 const [failedCoverRevisions, setFailedCoverRevisions] = useState<string[]>([]);
 const [draggedCollection, setDraggedCollection] = useState("");
 const [showHidden, setShowHidden] = useState(false);
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const catalogData = catalogQuery.data;
 const canEdit = useHanziHomeCanEdit();
 const coversQuery = useLibraryCovers();
 const courses = catalogData.courses;
 const books = catalogData.books;
 const lessons = catalogData.lessons;
 const courseGroups = useMemo(() => groupLibraryCourses(courses, books), [books, courses]);
 const selectedCollectionId = searchParams.get("collection");
 useEffect(() => {
  getAppScrollContainer()?.scrollTo({ behavior: "auto", top: 0 });
 }, [selectedCollectionId]);
 const selectedGroup = courseGroups.find((group) => group.key === selectedCollectionId);
 const selectedTextbook = textbooks.find((book) => book.id === selectedCollectionId);
 const editingCoverGroup = courseGroups.find((group) => editingCoverId === `group:${group.key}`);
 const editingCoverBook = textbooks.find((book) => editingCoverId === `static:${book.id}`);
 const editingCoverTitle = editingCoverGroup
  ? t(`groups.${editingCoverGroup.key}.title`)
  : editingCoverBook?.label;
 const searchTerm = query.trim().toLocaleLowerCase();
 const resumes = resolveLibraryResumes({
  courses,
  books,
  lessons,
  textbooks,
  settings: learning.state.settings,
 });
 const visibleGroups = filterLibraryGroups({
  groups: courseGroups,
  books,
  filter,
  searchTerm,
  getGroupTitle: (key) => t(`groups.${key}.title`),
 });
 const visibleTextbooks = filterLibraryTextbooks(textbooks, filter, searchTerm);
 const collectionOrder = buildLibraryCollectionOrder(
  learning.state.settings.libraryCollectionOrder ?? [],
  courseGroups,
  textbooks,
 );
 const hiddenCollectionIds = learning.state.settings.libraryHiddenCollections ?? [];
 const matchingCollectionIds = filterVisibleLibraryCollectionIds(
  collectionOrder,
  visibleGroups,
  visibleTextbooks,
 );
 const hiddenMatchCount = matchingCollectionIds.filter((id) =>
  hiddenCollectionIds.includes(id),
 ).length;
 const visibleCollectionIds = excludeHiddenLibraryCollections(
  matchingCollectionIds,
  hiddenCollectionIds,
  showHidden,
 );
 const canReorder = !learning.isLoading && !learning.isError;
 const setCollectionHidden = (collectionId: string, hidden: boolean) => {
  if (!canReorder) return;
  const others = hiddenCollectionIds.filter((id) => id !== collectionId);
  learning.updateSettings({
   libraryHiddenCollections: hidden ? [...others, collectionId] : others,
  });
 };
 const moveCollection = (sourceId: string, targetId: string) => {
  if (!canReorder || sourceId === targetId) return;
  const sourceIndex = collectionOrder.indexOf(sourceId);
  const targetIndex = collectionOrder.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const nextOrder = collectionOrder.filter((id) => id !== sourceId);
  nextOrder.splice(targetIndex, 0, sourceId);
  learning.updateSettings({ libraryCollectionOrder: nextOrder });
 };

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-4">
    {selectedCollectionId ? (
     <Button asChild variant="ghost" size="toolbar" align="start" className="justify-self-start">
      <Link href="/hanzihome" replace>
       <ArrowLeft data-icon="inline-start" />
       {t("title")}
      </Link>
     </Button>
    ) : (
     <Typography as="h1" variant="pageTitle" id="course-library-heading">
      {t("title")}
     </Typography>
    )}
    {canEdit ? (
     <HanziHomeLibraryCrudToolbar
      courses={courses}
      books={books}
      editMode={editMode}
      onEditModeChange={setEditMode}
     />
    ) : null}

    <LibrarySyncNotice learning={learning} />

    {selectedCollectionId ? (
     <LibrarySelectedCollection
      selectedGroup={selectedGroup}
      selectedTextbook={selectedTextbook}
      books={books}
      lessons={lessons}
      editMode={canEdit && editMode}
      isCatalogError={catalogQuery.isError}
      isCatalogPending={catalogQuery.isPending}
      onRetryCatalog={() => void catalogQuery.refetch()}
     />
    ) : null}
    <section
     aria-labelledby="course-library-heading"
     hidden={Boolean(selectedCollectionId)}
     className={cn("min-w-0 gap-4", selectedCollectionId ? "hidden" : "grid")}
    >
     <Typography as="p" variant="bodySmall" className="sr-only" id="library-order-hint">
      {t(isCoarsePointer ? "reorderHintTouch" : "reorderHint")}
     </Typography>

     <div className="flex min-w-0 flex-wrap items-center gap-3">
      <LibraryCollectionFilters
       query={query}
       filter={filter}
       onQueryChange={setQuery}
       onFilterChange={setFilter}
      />
      {hiddenMatchCount > 0 ? (
       <Button
        type="button"
        size="toolbar"
        variant={showHidden ? "active" : "outline"}
        aria-pressed={showHidden}
        title={t("hiddenCollectionsHint")}
        onClick={() => setShowHidden((current) => !current)}
       >
        <EyeOff data-icon="inline-start" />
        {t("hiddenCollections", { count: hiddenMatchCount })}
       </Button>
      ) : null}
      <LibraryArrangeDialog
       visibleCollectionIds={visibleCollectionIds}
       visibleGroups={visibleGroups}
       visibleTextbooks={visibleTextbooks}
       canReorder={canReorder}
       isCoarsePointer={isCoarsePointer}
       courses={courses}
       books={books}
       lessons={lessons}
       textbooks={textbooks}
       onMoveCollection={moveCollection}
      />
     </div>

     {catalogQuery.isError ? (
      <QueryErrorCard
       title={t("loadErrorTitle")}
       description={t("loadErrorDescription")}
       retryLabel={common("actions.retry")}
       onRetry={() => void catalogQuery.refetch()}
      />
     ) : null}
     {coversQuery.isError ? (
      <QueryErrorCard
       title={t("cover.loadError")}
       description={t("cover.loadErrorDescription")}
       retryLabel={common("actions.retry")}
       onRetry={() => void coversQuery.refetch()}
      />
     ) : null}

     <div
      role="group"
      aria-label={t("collectionsLabel")}
      className="grid min-w-0 grid-cols-2 items-start gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4"
     >
      {visibleCollectionIds.map((id, index) => {
       const group = visibleGroups.find((item) => id === `group:${item.key}`);
       const book = visibleTextbooks.find((item) => id === `static:${item.id}`);
       const title = group ? t(`groups.${group.key}.title`) : book?.label;
       const collectionKey = group?.key ?? book?.id;
       if (!title || !collectionKey) return null;

       return (
        <LibraryCollectionCard
         key={id}
         id={id}
         index={index}
         title={title}
         collectionKey={collectionKey}
         group={group}
         book={book}
         resumes={resumes}
         covers={coversQuery.data}
         failedCoverRevisions={failedCoverRevisions}
         draggedCollection={draggedCollection}
         visibleCollectionIds={visibleCollectionIds}
         canReorder={canReorder}
         canEditCovers={canEdit && editMode}
         canLoadCovers={coversQuery.isSuccess}
         hidden={hiddenCollectionIds.includes(id)}
         isCoarsePointer={isCoarsePointer}
         onCoverFailed={(coverRevision) =>
          setFailedCoverRevisions((current) => [...current, coverRevision])
         }
         onDraggedCollectionChange={setDraggedCollection}
         onEditCover={setEditingCoverId}
         onMenuTriggerInteract={(trigger) => {
          coverMenuTrigger.current = trigger;
         }}
         onMoveCollection={moveCollection}
         onHiddenChange={setCollectionHidden}
        />
       );
      })}
     </div>

     {catalogQuery.isPending ? <HanziHomeLibrarySkeleton /> : null}
     {!catalogQuery.isPending && !catalogQuery.isError && !visibleCollectionIds.length ? (
      <EmptyState
       surface="subtle"
       title={t(searchTerm ? "noSearchMatchesTitle" : "noMatchesTitle")}
       description={t(searchTerm ? "noSearchMatchesDescription" : "noMatchesDescription")}
      />
     ) : null}
    </section>
    {editingCoverTitle ? (
     <LibraryCoverDialog
      key={editingCoverId}
      collectionId={editingCoverId}
      title={editingCoverTitle}
      character={
       editingCoverGroup
        ? libraryCourseGroupCharacters[editingCoverGroup.key]
        : editingCoverBook
          ? libraryTextbookCharacters[editingCoverBook.key]
          : ""
      }
      cover={coversQuery.data?.find((item) => item.collectionId === editingCoverId)}
      onOpenChange={(open) => {
       if (!open) setEditingCoverId("");
      }}
      onClosed={() => coverMenuTrigger.current?.focus()}
     />
    ) : null}
   </div>
  </PageContainer>
 );
}
