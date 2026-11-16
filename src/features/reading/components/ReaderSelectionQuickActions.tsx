"use client";

import { Languages, MoreHorizontal, StickyNote, Trash2, Volume2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import type { ReaderSelectionPopoverContentProps } from "@/features/reading/components/ReaderSelectionPopoverContent";
import { HIGHLIGHT_COLORS } from "@/features/reading/model/reader-selection-model";

export function ReaderSelectionQuickActions({
 selection,
 selectedColor,
 openedAnnotation,
 saving,
 onModeChange,
 onSelectedColorChange,
 onClear,
 onSaveAnnotation,
 onRemoveAnnotation,
 onLookup,
 onListen,
}: ReaderSelectionPopoverContentProps) {
 const t = useTranslations("Reader.study.chrome.selection");
 const notesT = useTranslations("Reader.study.chrome.notes");

 return (
  <>
   {/* Nhóm 4 chấm màu tròn pastel */}
   <div className="flex items-center gap-1.5 px-1" role="group" aria-label="Tô màu">
    {HIGHLIGHT_COLORS.map(({ color, label, swatchStyle }) => {
     const isCurrent = openedAnnotation
      ? openedAnnotation.color === color
      : selectedColor === color;
     return (
      <Button
       key={color}
       type="button"
       variant="swatch"
       size="icon-xs"
       style={swatchStyle}
       aria-pressed={isCurrent}
       aria-label={`Màu ${label}`}
       title={`Tô màu ${label}`}
       disabled={saving}
       onClick={() => {
        onSelectedColorChange(color);
        if (openedAnnotation) {
         onSaveAnnotation(openedAnnotation.annotation_type, color);
        } else {
         onSaveAnnotation("highlight", color);
        }
       }}
      >
       <span className="sr-only">{label}</span>
      </Button>
     );
    })}
   </div>

   <div className="h-4 w-px bg-border-default/80" />

   {/* Nút Ghi chú */}
   <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    title={t("note")}
    aria-label={t("note")}
    onClick={() => onModeChange("note")}
   >
    <StickyNote className="size-3.5" />
   </Button>

   {/* Nút Tra từ */}
   <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    title={t("lookup")}
    aria-label={t("lookup")}
    onClick={() => onLookup(selection)}
   >
    <Languages className="size-3.5" />
   </Button>

   {/* Nút Nghe phát âm */}
   <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    title={t("listen")}
    aria-label={t("listen")}
    onClick={() => onListen(selection)}
   >
    <Volume2 className="size-3.5" />
   </Button>

   {/* Nút Xóa nhanh nếu là annotation có sẵn */}
   {openedAnnotation ? (
    <Button
     type="button"
     size="icon-xs"
     variant="destructive"
     title={notesT("delete")}
     aria-label={notesT("delete")}
     disabled={saving}
     onClick={() => onRemoveAnnotation(openedAnnotation.id, openedAnnotation.revision)}
    >
     <Trash2 className="size-3.5" />
    </Button>
   ) : null}

   {/* Nút Thao tác khác (...) */}
   <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    title="Thao tác khác"
    aria-label="Thao tác khác"
    onClick={() => onModeChange("more")}
   >
    <MoreHorizontal className="size-3.5" />
   </Button>

   {/* Nút Đóng */}
   <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    title={t("closeAria")}
    aria-label={t("closeAria")}
    onClick={onClear}
   >
    <X className="size-3.5" />
   </Button>
  </>
 );
}
