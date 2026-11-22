"use client";

import { useEffect, useMemo, type ComponentProps } from "react";
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
} from "@/features/hanzihome/static-json/textbook-catalog";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { BusinessChineseLessonActions } from "./BusinessChineseWorkspaceToolbar";
import { BusinessChineseLessonSelector } from "./BusinessChineseLessonSelector";

const headerOwnerId = "business-chinese-study";

export function BusinessChineseHeaderContextBridge({
 books,
 lesson,
 isLessonBookmarked,
 onToggleLessonBookmark,
 isLessonOfflineReady,
 audioSettingsOpen,
 onOpenAudioSettings,
 actionsTriggerRef,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 isLessonOfflineReady: boolean;
 audioSettingsOpen: boolean;
 onOpenAudioSettings: () => void;
 actionsTriggerRef: ComponentProps<typeof BusinessChineseLessonActions>["triggerRef"];
}) {
 const t = useTranslations("BusinessChinese");
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedBook = books.find((book) => book.key === lesson.bookKey);

 const content = useMemo(
  () => (
   <>
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
     <AppHeaderBreadcrumbItem className="hidden sm:inline-flex min-w-0 shrink-0">
      <AppHeaderBreadcrumbLink
       href={buildTextbookHref(lesson.bookKey, 1)}
       disabled={focusModeEnabled}
       className="max-w-[10rem] sm:max-w-[14rem] truncate font-medium text-foreground shrink-0"
       title={selectedBook?.label ?? lesson.bookLabel}
      >
       {selectedBook?.label ?? lesson.bookLabel}
      </AppHeaderBreadcrumbLink>
     </AppHeaderBreadcrumbItem>
     <AppHeaderBreadcrumbSeparator className="hidden sm:inline-flex" />
     <AppHeaderBreadcrumbItem className="min-w-0">
      <BusinessChineseLessonSelector
       books={books}
       lesson={lesson}
       focusModeEnabled={focusModeEnabled}
      />
     </AppHeaderBreadcrumbItem>
    </AppHeaderBreadcrumb>
    <BusinessChineseLessonActions
     isLessonBookmarked={isLessonBookmarked}
     onToggleLessonBookmark={onToggleLessonBookmark}
     isLessonOfflineReady={isLessonOfflineReady}
     audioSettingsOpen={audioSettingsOpen}
     onOpenAudioSettings={onOpenAudioSettings}
     triggerRef={actionsTriggerRef}
    />
   </>
  ),
  [
   books,
   focusModeEnabled,
   lesson,
   selectedBook,
   t,
   isLessonBookmarked,
   onToggleLessonBookmark,
   isLessonOfflineReady,
   audioSettingsOpen,
   onOpenAudioSettings,
   actionsTriggerRef,
  ],
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
