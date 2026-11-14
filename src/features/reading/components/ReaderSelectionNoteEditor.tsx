"use client";

import { Check, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Textarea } from "@/components/ui/forms/textarea";
import type { ReaderSelectionPopoverContentProps } from "@/features/reading/components/ReaderSelectionPopoverContent";
import { HIGHLIGHT_COLORS } from "@/features/reading/model/reader-selection-model";

export function ReaderSelectionNoteEditor({
 selection,
 selectedColor,
 noteDraft,
 openedAnnotation,
 saving,
 onModeChange,
 onSelectedColorChange,
 onNoteDraftChange,
 onClear,
 onSaveAnnotation,
 onRemoveAnnotation,
}: ReaderSelectionPopoverContentProps) {
 const t = useTranslations("Reader.study.chrome.selection");
 const notesT = useTranslations("Reader.study.chrome.notes");

 return (
  <>
   <div className="flex items-center justify-between gap-1">
    <div className="flex items-center" role="group" aria-label="Màu ghi chú">
     {HIGHLIGHT_COLORS.map(({ color, label, swatchStyle }) => {
      const isCurrent = openedAnnotation
       ? openedAnnotation.color === color
       : selectedColor === color;
      return (
       <Button
        key={color}
        type="button"
        variant="ghost"
        size="compact"
        className="w-8"
        aria-pressed={isCurrent}
        aria-label={`Màu ${label}`}
        title={`Màu ${label}`}
        disabled={saving}
        onClick={() => {
         onSelectedColorChange(color);
         if (openedAnnotation) {
          onSaveAnnotation(openedAnnotation.annotation_type, color);
         }
        }}
       >
        <span
         className="relative grid size-4 shrink-0 place-items-center rounded-full"
         style={swatchStyle}
         aria-hidden="true"
        >
         {isCurrent ? (
          <>
           <span className="absolute -inset-0.5 rounded-full border border-primary" />
           <Check className="size-3 text-primary-foreground" />
          </>
         ) : null}
        </span>
       </Button>
      );
     })}
    </div>
    <Button
     type="button"
     size="compact"
     variant="ghost"
     className="w-8"
     aria-label={t("closeAria")}
     onClick={() => (openedAnnotation ? onClear() : onModeChange("quick"))}
    >
     <X className="size-3.5" />
    </Button>
   </div>
   <Textarea
    density="compact"
    value={noteDraft}
    onChange={(event) => onNoteDraftChange(event.target.value)}
    placeholder={t("notePlaceholder")}
    aria-label={t("noteAria")}
    rows={2}
    autoFocus
   />
   <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
    {openedAnnotation ? (
     <Button
      type="button"
      size="compact"
      variant="menuDestructive"
      className="w-auto"
      disabled={saving}
      onClick={() => onRemoveAnnotation(openedAnnotation.id, openedAnnotation.revision)}
     >
      <Trash2 className="size-3.5" />
      {notesT("delete")}
     </Button>
    ) : null}
    <div className="ml-auto flex gap-1.5">
     <Button
      type="button"
      size="compact"
      variant="ghost"
      onClick={() => (openedAnnotation ? onClear() : onModeChange("quick"))}
     >
      {t("cancel")}
     </Button>
     <Button
      type="button"
      size="compact"
      variant="avatar"
      disabled={saving || !noteDraft.trim() || selection.start === null || selection.end === null}
      onClick={() => onSaveAnnotation("note", selectedColor)}
     >
      <Check className="size-3.5" />
      {t("saveNote")}
     </Button>
    </div>
   </div>
  </>
 );
}
