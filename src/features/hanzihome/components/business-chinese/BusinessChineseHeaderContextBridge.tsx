"use client";

import { useEffect, useMemo } from "react";
import { useSelector } from "@tanstack/react-store";
import { useTranslations } from "next-intl";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { buildTextbookHref } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type {
 TextbookBookSummary,
 TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { BusinessChineseLessonSelector } from "./BusinessChineseLessonSelector";

const headerOwnerId = "business-chinese-study";

export function BusinessChineseHeaderContextBridge({
 books,
 lesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedBook = books.find((book) => book.key === lesson.bookKey);

 const content = useMemo(
  () => (
   <AppHeaderBreadcrumb
    aria-label={t("lessonSelectLabel")}
    className="min-w-0 max-w-full justify-self-start"
   >
    <AppHeaderBreadcrumbItem className="hidden 2xl:inline-flex shrink-0">
     <AppHeaderBreadcrumbLink
      href="/hanzihome"
      disabled={focusModeEnabled}
      className="shrink-0"
      title="HanziHome"
     >
      HanziHome
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden 2xl:inline-flex" />
    <AppHeaderBreadcrumbItem className="min-w-0 shrink-0">
     <AppHeaderBreadcrumbLink
      href={buildTextbookHref(lesson.bookKey, 1)}
      disabled={focusModeEnabled}
      className="max-w-[10rem] sm:max-w-[14rem] truncate font-medium text-foreground shrink-0"
      title={selectedBook?.label ?? lesson.bookLabel}
     >
      {selectedBook?.label ?? lesson.bookLabel}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <BusinessChineseLessonSelector
      books={books}
      lesson={lesson}
      focusModeEnabled={focusModeEnabled}
     />
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [books, focusModeEnabled, lesson, selectedBook, t],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(headerOwnerId, content);
 }, [content]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(headerOwnerId);
  },
  [],
 );

 return null;
}
