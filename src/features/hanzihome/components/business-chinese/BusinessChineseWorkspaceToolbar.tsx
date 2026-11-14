"use client";

import { useMemo, type ComponentProps, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookOpen, CloudCheck, DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { type SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { OfflineAudioSettingsDialog } from "@/features/speech/OfflineAudioSettingsDialog";
import { cn } from "@/lib/utils";
import type { BusinessChineseGrammarNavigationControls } from "./BusinessChineseGrammarNavigation";
import { BusinessChineseWorkspaceNavMenu } from "./BusinessChineseWorkspaceNavMenu";

type NavMenuProps = ComponentProps<typeof BusinessChineseWorkspaceNavMenu>;

/** Memoized lesson view/bookmark menu shared by the reader toolbar and compact headers. */
export function useBusinessChineseToolbarNavMenu({
 tabs,
 activeView,
 onActiveViewChange,
 isLessonBookmarked,
 onToggleLessonBookmark,
 className,
}: {
 tabs: SegmentedControlItem<string>[];
 activeView: string;
 onActiveViewChange: (value: string) => void;
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 className: NavMenuProps["className"];
}) {
 const t = useTranslations("BusinessChinese");
 return useMemo(
  () => (
   <BusinessChineseWorkspaceNavMenu
    tabs={tabs}
    activeView={activeView}
    onActiveViewChange={onActiveViewChange}
    isLessonBookmarked={isLessonBookmarked}
    onToggleLessonBookmark={onToggleLessonBookmark}
    bookmarkLabel={t("bookmarkLesson")}
    bookmarkedLabel={t("bookmarked")}
    offlineReadyLabel={t("offlineReady")}
    offlineDescription={t("offlineDescription")}
    menuLabel={t("tabsLabel")}
    className={className}
   />
  ),
  [tabs, activeView, onActiveViewChange, isLessonBookmarked, onToggleLessonBookmark, t, className],
 );
}

/** Actions rendered beside the workspace tab list (reader toolbar, audio, bookmark, offline). */
export function BusinessChineseDesktopTabActions({
 lesson,
 readerToolbar,
 showCompactGrammarToolbar,
 grammarNavigationTriggerRef,
 isGrammarNavigationOpen,
 onOpenGrammarNavigation,
 isLessonBookmarked,
 onToggleLessonBookmark,
 isLessonOfflineReady,
 toolbarNavMenu,
}: {
 lesson: TextbookLesson;
 readerToolbar: ReactNode;
 showCompactGrammarToolbar: boolean;
 grammarNavigationTriggerRef: BusinessChineseGrammarNavigationControls["triggerRef"];
 isGrammarNavigationOpen: boolean;
 onOpenGrammarNavigation: () => void;
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 isLessonOfflineReady: boolean;
 toolbarNavMenu: ReactNode;
}) {
 const t = useTranslations("BusinessChinese");
 const shellHeader = useTranslations("Shell.header");
 return (
  <>
   {readerToolbar}
   {showCompactGrammarToolbar ? (
    <Button
     ref={grammarNavigationTriggerRef}
     type="button"
     variant="outline"
     size="toolbar"
     aria-label={t("tocLabel")}
     aria-haspopup="dialog"
     aria-expanded={isGrammarNavigationOpen}
     title={t("tocLabel")}
     onClick={onOpenGrammarNavigation}
    >
     <BookOpen data-icon="inline-start" />
     <span>{t("tocLabel")}</span>
    </Button>
   ) : null}
   <OfflineAudioSettingsDialog
    lesson={lesson}
    trigger={
     showCompactGrammarToolbar ? (
      <Button
       type="button"
       variant="outline"
       size="icon-toolbar"
       aria-label={shellHeader("voiceSettings")}
       title={shellHeader("voiceSettings")}
      >
       <DownloadCloud />
      </Button>
     ) : undefined
    }
   />
   <div className="flex shrink-0 items-center gap-1.5">
    <Button
     variant="ghost"
     size="sm"
     className="gap-1.5 shrink-0"
     onClick={onToggleLessonBookmark}
     title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
     aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
    >
     <Bookmark
      className={cn(
       "size-3.5",
       isLessonBookmarked ? "fill-warning text-warning" : "text-muted-foreground",
      )}
     />
     <span
      className={cn("hidden sm:inline", isLessonBookmarked && "font-semibold text-warning-text")}
     >
      {isLessonBookmarked ? t("bookmarked") : t("bookmarkLesson")}
     </span>
    </Button>
    {isLessonOfflineReady ? (
     <Badge
      variant="success"
      size="sm"
      casing="natural"
      className="cursor-default gap-1 shrink-0 hidden md:inline-flex"
      title={t("offlineDescription")}
     >
      <CloudCheck data-icon="inline-start" />
      <span>{t("offlineReady")}</span>
     </Badge>
    ) : null}
   </div>
   {showCompactGrammarToolbar ? toolbarNavMenu : null}
  </>
 );
}

/** Below-xl header for non-reader views: current view label, bookmark and view menu. */
export function BusinessChineseCompactViewToolbar({
 tabs,
 activeView,
 isLessonBookmarked,
 onToggleLessonBookmark,
 toolbarNavMenu,
}: {
 tabs: SegmentedControlItem<string>[];
 activeView: string;
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 toolbarNavMenu: ReactNode;
}) {
 const t = useTranslations("BusinessChinese");
 return (
  <div className="shrink-0 xl:hidden">
   <WorkspaceToolbar>
    <div className="flex min-w-0 flex-1 items-center gap-2">
     <Typography variant="bodySmall" weight="bold" clamp="one">
      {tabs.find((tab) => tab.key === activeView)?.label ?? t("tabsLabel")}
     </Typography>
    </div>
    <div className="flex shrink-0 items-center gap-1.5">
     <Button
      variant={isLessonBookmarked ? "warning" : "ghost"}
      size="icon-toolbar"
      onClick={onToggleLessonBookmark}
      title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
      aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
     >
      <Bookmark
       className={cn(
        "size-4",
        isLessonBookmarked ? "fill-current text-warning" : "text-muted-foreground",
       )}
      />
     </Button>
     {toolbarNavMenu}
    </div>
   </WorkspaceToolbar>
  </div>
 );
}
