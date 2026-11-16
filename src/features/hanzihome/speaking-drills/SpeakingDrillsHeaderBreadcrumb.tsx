"use client";

import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";

import type { SpeakingDrillSelection, SpeakingDrillsCatalogBook } from "./speaking-drills.types";
import { speakingDrillsHref } from "./speaking-drills-utils";

const headerOwnerId = "speaking-drills";

/** Publishes the book › scenario breadcrumb into the global header, like the textbook workspaces. */
export function SpeakingDrillsHeaderBreadcrumb({
 catalog,
 selection,
 onSelectTopic,
}: {
 catalog: SpeakingDrillsCatalogBook[];
 selection: SpeakingDrillSelection;
 onSelectTopic: (topicId: string) => void;
}) {
 const t = useTranslations("SpeakingDrills");
 const tShell = useTranslations("Shell");
 const book = catalog.find((candidate) => candidate.id === selection.bookId) ?? catalog[0];
 const topicLabel = t("topicOption", {
  number: selection.topic.no,
  title: selection.topic.titleVi,
 });

 useEffect(() => {
  const selectBook = (bookId: string) => {
   const firstTopicId = catalog
    .filter((candidate) => candidate.id === bookId)
    .flatMap((candidate) => candidate.lessons)
    .flatMap((lesson) => lesson.topics)
    .map((topic) => topic.id)
    .find(Boolean);
   if (firstTopicId && bookId !== book.id) onSelectTopic(firstTopicId);
  };
  const content = (
   <AppHeaderBreadcrumb aria-label={t("breadcrumbAria")} className="min-w-0 max-w-full">
    <AppHeaderBreadcrumbItem className="hidden shrink-0 2xl:inline-flex">
     <AppHeaderBreadcrumbLink href={speakingDrillsHref("")} className="shrink-0">
      {tShell("navigation.items.speakingDrills")}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden 2xl:inline-flex" />
    <AppHeaderBreadcrumbItem className="hidden shrink-0 sm:inline-flex">
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button
        type="button"
        variant="ghost"
        aria-label={t("bookLabel")}
        title={book.title}
        className="shrink-0 justify-between"
       >
        <span className="truncate">{book.name}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" width="lg">
       <DropdownMenuRadioGroup value={book.id} onValueChange={selectBook}>
        {catalog.map((catalogBook) => (
         <DropdownMenuRadioItem key={catalogBook.id} value={catalogBook.id}>
          <span className="grid min-w-0 gap-0.5">
           <span className="truncate">{catalogBook.name}</span>
           <span className="truncate text-xs font-medium text-text-muted">
            {catalogBook.subtitle}
           </span>
          </span>
         </DropdownMenuRadioItem>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuContent>
     </DropdownMenu>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden sm:inline-flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button
        type="button"
        variant="ghost"
        aria-label={t("topicLabel")}
        className="w-auto min-w-[9rem] max-w-[min(20rem,52vw)] justify-between md:max-w-[min(26rem,38vw)]"
       >
        <span className="truncate">{topicLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
       align="start"
       className="max-h-[min(28rem,var(--radix-dropdown-menu-content-available-height))] min-w-[min(28rem,calc(100vw-2rem))]"
      >
       {/* The breadcrumb book menu is hidden on phones, so the topic menu carries book switching there. */}
       <DropdownMenuGroup className="sm:hidden">
        <DropdownMenuLabel>{t("bookLabel")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={book.id} onValueChange={selectBook}>
         {catalog.map((catalogBook) => (
          <DropdownMenuRadioItem key={catalogBook.id} value={catalogBook.id}>
           {catalogBook.name}
          </DropdownMenuRadioItem>
         ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
       </DropdownMenuGroup>
       <DropdownMenuRadioGroup value={selection.topic.id} onValueChange={onSelectTopic}>
        {book.lessons.map((lesson) => (
         <DropdownMenuGroup key={lesson.id}>
          <DropdownMenuLabel>
           {t("lessonGroup", { number: lesson.no, title: lesson.title })}
          </DropdownMenuLabel>
          {lesson.topics.map((topic) => (
           <DropdownMenuRadioItem key={topic.id} value={topic.id}>
            <span className="truncate">
             {t("topicOption", { number: topic.no, title: topic.titleVi })}
            </span>
           </DropdownMenuRadioItem>
          ))}
         </DropdownMenuGroup>
        ))}
       </DropdownMenuRadioGroup>
      </DropdownMenuContent>
     </DropdownMenu>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  );
  headerToolbarStore.actions.setOwnedContent(headerOwnerId, content);
 }, [book, catalog, onSelectTopic, selection.topic.id, t, tShell, topicLabel]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(headerOwnerId);
  },
  [],
 );

 return null;
}
