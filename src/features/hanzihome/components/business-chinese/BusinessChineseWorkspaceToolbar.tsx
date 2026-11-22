"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookOpen, CloudCheck, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import type { BusinessChineseGrammarNavigationControls } from "./BusinessChineseGrammarNavigation";

/** Lesson utilities stay with the lesson header, separate from module and audio controls. */
export function BusinessChineseLessonActions({
 isLessonBookmarked,
 onToggleLessonBookmark,
 isLessonOfflineReady,
}: {
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 isLessonOfflineReady: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const bookmarkLabel = isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson");

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-toolbar" aria-label={t("lessonOptions")}>
     <MoreHorizontal />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="start" width="md">
    <DropdownMenuLabel>{t("lessonOptions")}</DropdownMenuLabel>
    <DropdownMenuItem onSelect={onToggleLessonBookmark}>
     <Bookmark />
     {bookmarkLabel}
    </DropdownMenuItem>
    {isLessonOfflineReady ? (
     <DropdownMenuItem disabled>
      <CloudCheck />
      {t("offlineReady")}
     </DropdownMenuItem>
    ) : null}
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

/** Reader commands and contextual section navigation share the module row. */
export function BusinessChineseDesktopTabActions({
 readerToolbar,
 showCompactGrammarToolbar,
 grammarNavigationTriggerRef,
 isGrammarNavigationOpen,
 onOpenGrammarNavigation,
}: {
 readerToolbar: ReactNode;
 showCompactGrammarToolbar: boolean;
 grammarNavigationTriggerRef: BusinessChineseGrammarNavigationControls["triggerRef"];
 isGrammarNavigationOpen: boolean;
 onOpenGrammarNavigation: () => void;
}) {
 const t = useTranslations("BusinessChinese");
 return (
  <>
   {readerToolbar}
   {showCompactGrammarToolbar ? (
    <Button
     ref={grammarNavigationTriggerRef}
     variant="outline"
     size="toolbar"
     aria-label={t("tocLabel")}
     aria-haspopup="dialog"
     aria-expanded={isGrammarNavigationOpen}
     onClick={onOpenGrammarNavigation}
    >
     <BookOpen data-icon="inline-start" />
     {t("tocLabel")}
    </Button>
   ) : null}
  </>
 );
}
