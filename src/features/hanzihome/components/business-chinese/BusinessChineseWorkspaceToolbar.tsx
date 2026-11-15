"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookOpen, CloudCheck, MoreHorizontal, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Typography } from "@/components/ui/display/typography";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import type { BusinessChineseGrammarNavigationControls } from "./BusinessChineseGrammarNavigation";

/** Lesson utilities stay with the lesson header, separate from module and audio controls. */
export function BusinessChineseLessonActions({
 isLessonBookmarked,
 onToggleLessonBookmark,
 isLessonOfflineReady,
 compact,
 audioSettingsOpen,
 onOpenAudioSettings,
 triggerRef,
 onReturnFocus,
}: {
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 isLessonOfflineReady: boolean;
 compact: boolean;
 audioSettingsOpen: boolean;
 onOpenAudioSettings: () => void;
 triggerRef: ComponentProps<typeof Button>["ref"];
 onReturnFocus: () => void;
}) {
 const t = useTranslations("BusinessChinese");
 const common = useTranslations("Common.actions");
 const coarsePointer = useCoarsePointer();
 const [open, setOpen] = useState(false);
 const bookmarkLabel = isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson");

 return (
  <>
   {compact || coarsePointer ? (
    <>
     <Button
      ref={triggerRef}
      variant="ghost"
      size="icon-toolbar"
      aria-label={t("lessonOptions")}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
     >
      <MoreHorizontal />
     </Button>
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
       size="sm"
       closeLabel={common("close")}
       aria-describedby={undefined}
       onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (!audioSettingsOpen) onReturnFocus();
       }}
      >
       <DialogHeader>
        <DialogTitle>{t("lessonOptions")}</DialogTitle>
       </DialogHeader>
       <DialogBody className="content-start gap-1">
        <Button variant="menu" size="menu" onClick={onToggleLessonBookmark}>
         <Bookmark />
         {bookmarkLabel}
        </Button>
        <Button
         variant="menu"
         size="menu"
         onClick={() => {
          setOpen(false);
          onOpenAudioSettings();
         }}
        >
         <Volume2 />
         {t("voiceAndOffline")}
        </Button>
        {isLessonOfflineReady ? (
         <Typography variant="caption" tone="muted">
          {t("offlineReady")}
         </Typography>
        ) : null}
       </DialogBody>
      </DialogContent>
     </Dialog>
    </>
   ) : (
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button ref={triggerRef} variant="ghost" size="icon-toolbar" aria-label={t("lessonOptions")}>
       <MoreHorizontal />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent
      align="start"
      width="md"
      onCloseAutoFocus={(event) => {
       if (audioSettingsOpen) event.preventDefault();
      }}
     >
      <DropdownMenuLabel>{t("lessonOptions")}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onToggleLessonBookmark}>
       <Bookmark />
       {bookmarkLabel}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onOpenAudioSettings}>
       <Volume2 />
       {t("voiceAndOffline")}
      </DropdownMenuItem>
      {isLessonOfflineReady ? (
       <DropdownMenuItem disabled>
        <CloudCheck />
        {t("offlineReady")}
       </DropdownMenuItem>
      ) : null}
     </DropdownMenuContent>
    </DropdownMenu>
   )}
  </>
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
