"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
 ArrowDown,
 ArrowRight,
 ArrowUp,
 ArrowUpDown,
 Ellipsis,
 ImageIcon,
 Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { Chip } from "@/components/ui/actions/chip";
import { Input } from "@/components/ui/forms/input";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { CourseCollectionSection } from "@/features/hanzihome/components/library/CourseCollectionSection";
import { HanziHomeLibrarySkeleton } from "@/features/hanzihome/components/library/HanziHomeLibrarySkeleton";
import { HanziHomeLibraryCrudToolbar } from "@/features/hanzihome/components/library/HanziHomeLibraryCrudToolbar";
import {
 groupLibraryCourses,
 libraryCourseGroupCharacters,
 libraryTextbookCharacters,
} from "@/features/hanzihome/components/library/library-course-groups";
import { RecentLearningCard } from "@/features/hanzihome/components/library/RecentLearningCard";
import { LibraryCoverDialog } from "@/features/hanzihome/components/library/LibraryCoverDialog";
import { useLibraryCovers } from "@/features/hanzihome/components/library/useLibraryCovers";
import { resolveLibraryResumes } from "@/features/hanzihome/components/library/recent-learning";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 buildTextbookHref,
 lessonDisplayTitle,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { Link } from "@/i18n/navigation";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

export function HanziHomeLibraryHome({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const t = useTranslations("Common.library");
 const common = useTranslations("Common");
 const learning = useLearningState();
 const isCoarsePointer = useCoarsePointer();
 const [editMode, setEditMode] = useState(false);
 const [filter, setFilter] = useState("all");
 const [query, setQuery] = useState("");
 const [editingCoverId, setEditingCoverId] = useState("");
 const coverMenuTrigger = useRef<HTMLButtonElement>(null);
 const [failedCoverRevisions, setFailedCoverRevisions] = useState<string[]>([]);
 const [draggedCollection, setDraggedCollection] = useState("");
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const catalogData = catalogQuery.data;
 const canEdit = useHanziHomeCanEdit();
 const coversQuery = useLibraryCovers();
 const courses = catalogData.courses;
 const books = catalogData.books;
 const lessons = catalogData.lessons;
 const courseGroups = useMemo(() => groupLibraryCourses(courses, books), [books, courses]);
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
 const visibleGroups = courseGroups.filter(
  (group) =>
   (filter === "all" ||
    (filter === "hanyu" && group.key === "hanyu") ||
    (filter === "boya" && (group.key === "boya" || group.key === "boyaSecondEdition")) ||
    (filter === "specialized" && (group.key === "listening" || group.key === "other"))) &&
   (t(`groups.${group.key}.title`).toLocaleLowerCase().includes(searchTerm) ||
    group.courses.some(
     (course) =>
      course.title.toLocaleLowerCase().includes(searchTerm) ||
      books.some(
       (book) => book.courseId === course.id && book.title.toLocaleLowerCase().includes(searchTerm),
      ),
    )),
 );
 const visibleTextbooks =
  filter === "all" || filter === "specialized"
   ? textbooks.filter((book) => book.label.toLocaleLowerCase().includes(searchTerm))
   : [];
 const collectionOrder = [
  ...new Set([
   ...(learning.state.settings.libraryCollectionOrder ?? []),
   ...courseGroups.map((group) => `group:${group.key}`),
   ...textbooks.map((book) => `static:${book.id}`),
  ]),
 ];
 const visibleCollectionIds = collectionOrder.filter(
  (id) =>
   visibleGroups.some((group) => id === `group:${group.key}`) ||
   visibleTextbooks.some((book) => id === `static:${book.id}`),
 );
 const canReorder = !learning.isLoading && !learning.isError;
 const moveCollection = (sourceId: string, targetId: string) => {
  if (!canReorder || sourceId === targetId) return;
  const sourceIndex = collectionOrder.indexOf(sourceId);
  const targetIndex = collectionOrder.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const nextOrder = collectionOrder.filter((id) => id !== sourceId);
  nextOrder.splice(targetIndex, 0, sourceId);
  learning.updateSettings({ libraryCollectionOrder: nextOrder });
 };
 const filters = [
  { value: "all", label: t("filters.all") },
  { value: "hanyu", label: t("filters.hanyu") },
  { value: "boya", label: t("filters.boya") },
  { value: "specialized", label: t("filters.specialized") },
 ];

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-6">
    <Typography as="h1" variant="pageTitle" id="course-library-heading">
     {t("title")}
    </Typography>
    {canEdit ? (
     <HanziHomeLibraryCrudToolbar
      courses={courses}
      books={books}
      editMode={editMode}
      onEditModeChange={setEditMode}
     />
    ) : null}

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

    <section aria-labelledby="course-library-heading" className="grid min-w-0 gap-4">
     <Typography as="p" variant="bodySmall" className="sr-only" id="library-order-hint">
      {t(isCoarsePointer ? "reorderHintTouch" : "reorderHint")}
     </Typography>

     <div className="flex min-w-0 flex-wrap items-center gap-3">
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
        onChange={(event) => setQuery(event.target.value)}
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
         onClick={() => setFilter(item.value)}
        >
         {item.label}
        </Chip>
       ))}
      </div>
      <Dialog>
       <DialogTrigger asChild>
        <Button variant="outline" size="toolbar" className="sm:ml-auto">
         <ArrowUpDown data-icon="inline-start" />
         {t("arrange")}
        </Button>
       </DialogTrigger>
       <DialogContent size="lg" closeLabel={common("actions.close")}>
        <DialogHeader>
         <DialogTitle>{t("arrange")}</DialogTitle>
         <DialogDescription>{t("arrangeDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-5">
         <div className="grid gap-2">
          {visibleCollectionIds.map((id, index) => {
           const group = visibleGroups.find((item) => id === `group:${item.key}`);
           const book = visibleTextbooks.find((item) => id === `static:${item.id}`);
           const title = group ? t(`groups.${group.key}.title`) : book?.label;
           if (!title) return null;
           return (
            <div key={id} className="flex min-w-0 items-center gap-2">
             <Typography variant="bodySmall" className="min-w-0 flex-1" wrapping="breakWords">
              <HanziInlineText text={title} />
             </Typography>
             <Button
              variant="ghost"
              size="icon"
              aria-label={`${t("moveEarlier")}: ${title}`}
              disabled={!canReorder || index === 0}
              onClick={() => {
               const previousId = visibleCollectionIds[index - 1];
               if (previousId) moveCollection(id, previousId);
              }}
             >
              <ArrowUp />
             </Button>
             <Button
              variant="ghost"
              size="icon"
              aria-label={`${t("moveLater")}: ${title}`}
              disabled={!canReorder || index === visibleCollectionIds.length - 1}
              onClick={() => {
               const nextId = visibleCollectionIds[index + 1];
               if (nextId) moveCollection(id, nextId);
              }}
             >
              <ArrowDown />
             </Button>
            </div>
           );
          })}
         </div>
         <RecentLearningCard
          courses={courses}
          books={books}
          lessons={lessons}
          textbooks={textbooks}
         />
        </DialogBody>
       </DialogContent>
      </Dialog>
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
       if (!title) return null;
       const character = group
        ? libraryCourseGroupCharacters[group.key]
        : book
          ? libraryTextbookCharacters[book.key]
          : "";
       const resumeId = resumes.order.find((key) =>
        resumes.catalog.some(
         (item) =>
          lessonBookKey(item.lesson) === key &&
          group?.courses.some((course) => course.id === item.course.id),
        ),
       );
       const recent = resumes.catalog.find((item) => lessonBookKey(item.lesson) === resumeId);
       const textbookResume = resumes.textbooks.find((item) => item.book.id === book?.id);
       const cover = coversQuery.data?.find((item) => item.collectionId === id);
       const coverRevision = cover ? `${id}:${cover.updatedAt}` : "";
       const hasCustomCover = cover && !failedCoverRevisions.includes(coverRevision);
       const resumeHref =
        recent?.href ??
        (textbookResume
         ? `${buildTextbookHref(textbookResume.book.key, textbookResume.lesson.number)}&tab=${encodeURIComponent(textbookResume.module)}`
         : "");

       return (
        <Dialog key={id}>
         <article
          data-library-collection={id}
          className={cn("grid min-w-0 gap-2", draggedCollection === id && "opacity-40")}
          onDragOver={(event) => {
           if (draggedCollection && canReorder) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
           }
          }}
          onDrop={(event) => {
           event.preventDefault();
           if (draggedCollection) moveCollection(draggedCollection, id);
           setDraggedCollection("");
          }}
         >
          <div
           draggable={!isCoarsePointer && canReorder && visibleCollectionIds.length > 1}
           className={cn(
            "grid min-w-0 gap-2",
            !isCoarsePointer && canReorder && "cursor-grab active:cursor-grabbing",
           )}
           onDragStart={(event) => {
            setDraggedCollection(id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", id);
           }}
           onDragEnd={() => setDraggedCollection("")}
          >
           <DialogTrigger asChild>
            <Button
             variant="ghost"
             size="inline"
             className="relative aspect-[4/5] w-full"
             aria-label={`${t("viewLessons")}: ${title}`}
            >
             <Image
              src={hasCustomCover ? cover.coverUrl : "/textbooks/common-cover.svg"}
              alt=""
              width={600}
              height={750}
              unoptimized
              draggable={false}
              className="pointer-events-none absolute inset-0 size-full object-cover"
              onError={() => {
               if (hasCustomCover)
                setFailedCoverRevisions((current) => [...current, coverRevision]);
              }}
             />
             {!hasCustomCover ? (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
               <svg viewBox="0 0 600 750" className="size-full" color="#24384b">
                <foreignObject x="92" y="94" width="180" height="170">
                 <span className="block text-left font-serif text-2xl leading-snug tracking-wide whitespace-normal uppercase wrap-break-word">
                  <HanziInlineText text={title} />
                 </span>
                </foreignObject>
                <text
                 x="398"
                 y="350"
                 textAnchor="middle"
                 fontSize="320"
                 fill="currentColor"
                 lang="zh-CN"
                 className="font-hanzi"
                >
                 {character}
                </text>
               </svg>
              </span>
             ) : null}
            </Button>
           </DialogTrigger>
          </div>
          <div className="flex min-w-0 items-start gap-1">
           <div className="grid min-w-0 flex-1 gap-1">
            <Typography as="h3" variant="cardTitle" weight="bold" wrapping="breakWords">
             {group ? title : <HanziInlineText text={title} />}
            </Typography>
            <Typography variant="bodySmall" tone="muted">
             {group
              ? t("bookCount", { count: group.bookCount })
              : book && t("lessonCount", { count: book.lessons.length })}
            </Typography>
           </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
             <Button
              type="button"
              variant="ghost"
              size={isCoarsePointer ? "icon" : "icon-toolbar"}
              disabled={(!canReorder || visibleCollectionIds.length < 2) && !(canEdit && editMode)}
              aria-label={t("reorderCollection", { title })}
              aria-describedby="library-order-hint"
              title={t("reorderCollection", { title })}
              onPointerDown={(event) => {
               coverMenuTrigger.current = event.currentTarget;
              }}
              onKeyDown={(event) => {
               coverMenuTrigger.current = event.currentTarget;
              }}
             >
              <Ellipsis />
             </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
             <DropdownMenuItem
              disabled={!canReorder || index === 0}
              onSelect={() => {
               const previousId = visibleCollectionIds[index - 1];
               if (previousId) moveCollection(id, previousId);
              }}
             >
              <ArrowUp />
              {t("moveEarlier")}
             </DropdownMenuItem>
             <DropdownMenuItem
              disabled={!canReorder || index === visibleCollectionIds.length - 1}
              onSelect={() => {
               const nextId = visibleCollectionIds[index + 1];
               if (nextId) moveCollection(id, nextId);
              }}
             >
              <ArrowDown />
              {t("moveLater")}
             </DropdownMenuItem>
             {canEdit && editMode ? (
              <DropdownMenuItem
               disabled={!coversQuery.isSuccess}
               onSelect={() => setEditingCoverId(id)}
              >
               <ImageIcon />
               {t("cover.edit")}
              </DropdownMenuItem>
             ) : null}
            </DropdownMenuContent>
           </DropdownMenu>
          </div>
          {cover && !hasCustomCover ? (
           <Typography variant="caption" tone="muted" role="status">
            {t("cover.previewError")}
           </Typography>
          ) : null}
          {resumeHref ? (
           <Button
            asChild
            variant="link"
            size="inline"
            align="start"
            wrap="normal"
            className="w-full"
           >
            <Link href={resumeHref}>
             <Typography as="span" variant="caption" tone="inherit" clamp="two">
              <HanziInlineText
               text={
                recent
                 ? `${recent.book?.shortTitle || recent.book?.title || recent.course.title} · ${t("lessonLabel", { number: recent.lesson.lessonNumber, title: recent.lesson.titleZh || recent.lesson.title })}`
                 : textbookResume
                   ? textbookResume.lesson.title.startsWith("ÔN TẬP ")
                    ? textbookResume.lesson.title
                    : t("lessonLabel", {
                       number: textbookResume.lesson.number,
                       title: lessonDisplayTitle(textbookResume.lesson.title),
                      })
                   : t("resume")
               }
              />
             </Typography>
            </Link>
           </Button>
          ) : null}
         </article>
         <DialogContent size="xl" closeLabel={common("actions.close")}>
          <DialogHeader>
           <DialogTitle>{group ? title : <HanziInlineText text={title} />}</DialogTitle>
           <DialogDescription>
            {group
             ? t("courseSeriesDescription")
             : book && t("lessonCount", { count: book.lessons.length })}
           </DialogDescription>
          </DialogHeader>
          <DialogBody>
           {group ? (
            <CourseCollectionSection
             group={group}
             books={books}
             lessons={lessons}
             editMode={canEdit && editMode}
            />
           ) : book ? (
            <div className="grid gap-2">
             {book.lessons.map((lesson) => (
              <Button key={lesson.id} asChild variant="ghost" align="between" wrap="normal">
               <Link href={buildTextbookHref(book.key, lesson.number)}>
                <span className="min-w-0 flex-1">
                 <HanziInlineText
                  text={
                   lesson.title.startsWith("ÔN TẬP ")
                    ? lesson.title
                    : t("lessonLabel", {
                       number: lesson.number,
                       title: lessonDisplayTitle(lesson.title),
                      })
                  }
                 />
                </span>
                <ArrowRight data-icon="inline-end" />
               </Link>
              </Button>
             ))}
            </div>
           ) : null}
          </DialogBody>
         </DialogContent>
        </Dialog>
       );
      })}
     </div>

     {catalogQuery.isPending ? <HanziHomeLibrarySkeleton /> : null}
     {!catalogQuery.isPending &&
     !catalogQuery.isError &&
     !visibleGroups.length &&
     !visibleTextbooks.length ? (
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
