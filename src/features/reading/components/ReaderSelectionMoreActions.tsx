"use client";

import { BookmarkPlus, ChevronLeft, Info, Play, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import type { ReaderSelectionPopoverContentProps } from "@/features/reading/components/ReaderSelectionPopoverContent";

export function ReaderSelectionMoreActions({
 selection,
 openedAnnotation,
 saving,
 onModeChange,
 onClear,
 onRemoveAnnotation,
 onAddToReview,
 onLookup,
 onPlayFromHere,
}: ReaderSelectionPopoverContentProps) {
 const t = useTranslations("Reader.study.chrome.selection");
 const notesT = useTranslations("Reader.study.chrome.notes");

 return (
  <>
   <div className="flex items-center justify-between gap-1 pb-1 border-b border-border-default">
    <div className="flex items-center gap-1 min-w-0">
     <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      title="Trở lại"
      aria-label="Trở lại"
      onClick={() => onModeChange("quick")}
     >
      <ChevronLeft className="size-3.5" />
     </Button>
     <Typography as="span" variant="bodySmall" weight="bold" clamp="one">
      {selection.text}
     </Typography>
    </div>
    <Button
     type="button"
     size="icon-xs"
     variant="ghost"
     aria-label={t("closeAria")}
     onClick={onClear}
    >
     <X className="size-3.5" />
    </Button>
   </div>

   <div className="grid gap-0.5">
    {onPlayFromHere && selection.start !== null ? (
     <Button
      type="button"
      size="compact"
      variant="ghost"
      align="start"
      onClick={() => onPlayFromHere(selection)}
     >
      <Play className="size-3.5" />
      {t("playFromHere")}
     </Button>
    ) : null}

    <Button type="button" size="compact" variant="ghost" align="start" onClick={onAddToReview}>
     <BookmarkPlus className="size-3.5" />
     {t("review")}
    </Button>

    <Button
     type="button"
     size="compact"
     variant="ghost"
     align="start"
     onClick={() => onLookup(selection)}
    >
     <Info className="size-3.5" />
     {t("understand")}
    </Button>

    {openedAnnotation ? (
     <Button
      type="button"
      size="compact"
      variant="menuDestructive"
      align="start"
      disabled={saving}
      onClick={() => onRemoveAnnotation(openedAnnotation.id, openedAnnotation.revision)}
     >
      <Trash2 className="size-3.5" />
      {notesT("delete")}
     </Button>
    ) : null}
   </div>
  </>
 );
}
