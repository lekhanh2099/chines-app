"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Ellipsis, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import {
 libraryCourseGroupCharacters,
 libraryTextbookCharacters,
 type LibraryCourseGroup,
} from "@/features/hanzihome/components/library/library-course-groups";
import type { LibraryCover } from "@/features/hanzihome/components/library/library-cover.schema";
import type { resolveLibraryResumes } from "@/features/hanzihome/components/library/recent-learning";
import { HanziInlineText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 buildTextbookHref,
 lessonDisplayTitle,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { lessonBookKey } from "@/features/hanzihome/utils/learning-state";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LibraryCollectionCard({
 id,
 index,
 title,
 collectionKey,
 group,
 book,
 resumes,
 covers,
 failedCoverRevisions,
 draggedCollection,
 visibleCollectionIds,
 canReorder,
 canEditCovers,
 canLoadCovers,
 isCoarsePointer,
 onCoverFailed,
 onDraggedCollectionChange,
 onEditCover,
 onMenuTriggerInteract,
 onMoveCollection,
}: {
 id: string;
 index: number;
 title: string;
 collectionKey: string;
 group?: LibraryCourseGroup;
 book?: TextbookBookSummary;
 resumes: ReturnType<typeof resolveLibraryResumes>;
 covers?: LibraryCover[];
 failedCoverRevisions: string[];
 draggedCollection: string;
 visibleCollectionIds: string[];
 canReorder: boolean;
 canEditCovers: boolean;
 canLoadCovers: boolean;
 isCoarsePointer: boolean;
 onCoverFailed: (coverRevision: string) => void;
 onDraggedCollectionChange: (collectionId: string) => void;
 onEditCover: (collectionId: string) => void;
 onMenuTriggerInteract: (trigger: HTMLButtonElement) => void;
 onMoveCollection: (sourceId: string, targetId: string) => void;
}) {
 const t = useTranslations("Common.library");
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
 const cover = covers?.find((item) => item.collectionId === id);
 const coverRevision = cover ? `${id}:${cover.updatedAt}` : "";
 const hasCustomCover = cover && !failedCoverRevisions.includes(coverRevision);
 const resumeHref =
  recent?.href ??
  (textbookResume
   ? `${buildTextbookHref(textbookResume.book.key, textbookResume.lesson.number)}&tab=${encodeURIComponent(textbookResume.module)}`
   : "");

 return (
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
    if (draggedCollection) onMoveCollection(draggedCollection, id);
    onDraggedCollectionChange("");
   }}
  >
   <div
    draggable={!isCoarsePointer && canReorder && visibleCollectionIds.length > 1}
    className={cn(
     "grid min-w-0 gap-2",
     !isCoarsePointer && canReorder && "cursor-grab active:cursor-grabbing",
    )}
    onDragStart={(event) => {
     onDraggedCollectionChange(id);
     event.dataTransfer.effectAllowed = "move";
     event.dataTransfer.setData("text/plain", id);
    }}
    onDragEnd={() => onDraggedCollectionChange("")}
   >
    <Button
     asChild
     variant="ghost"
     size="inline"
     className="relative aspect-[4/5] w-full"
     aria-label={`${t("viewLessons")}: ${title}`}
    >
     <Link href={`/hanzihome?collection=${encodeURIComponent(collectionKey)}`}>
      <Image
       src={hasCustomCover ? cover.coverUrl : "/textbooks/common-cover.svg"}
       alt=""
       width={600}
       height={750}
       unoptimized
       draggable={false}
       className="pointer-events-none absolute inset-0 size-full object-cover"
       onError={() => {
        if (hasCustomCover) onCoverFailed(coverRevision);
       }}
      />
      {!hasCustomCover ? <LibraryCollectionCoverArt title={title} character={character} /> : null}
     </Link>
    </Button>
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
       disabled={(!canReorder || visibleCollectionIds.length < 2) && !canEditCovers}
       aria-label={t("reorderCollection", { title })}
       aria-describedby="library-order-hint"
       title={t("reorderCollection", { title })}
       onPointerDown={(event) => {
        onMenuTriggerInteract(event.currentTarget);
       }}
       onKeyDown={(event) => {
        onMenuTriggerInteract(event.currentTarget);
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
        if (previousId) onMoveCollection(id, previousId);
       }}
      >
       <ArrowUp />
       {t("moveEarlier")}
      </DropdownMenuItem>
      <DropdownMenuItem
       disabled={!canReorder || index === visibleCollectionIds.length - 1}
       onSelect={() => {
        const nextId = visibleCollectionIds[index + 1];
        if (nextId) onMoveCollection(id, nextId);
       }}
      >
       <ArrowDown />
       {t("moveLater")}
      </DropdownMenuItem>
      {canEditCovers ? (
       <DropdownMenuItem disabled={!canLoadCovers} onSelect={() => onEditCover(id)}>
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
    <Button asChild variant="link" size="inline" align="start" wrap="normal" className="w-full">
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
 );
}

function LibraryCollectionCoverArt({ title, character }: { title: string; character: string }) {
 return (
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
 );
}
