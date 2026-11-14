"use client";

import { BookmarkPlus, Check, ChevronRight, Loader2, NotebookPen, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import type { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { NoteLinkToggleButtons } from "./NoteLinkToggleButtons";
import { preserveEditorSelection } from "./preserve-editor-selection";
import type { useFloatingMenuPanels } from "./useFloatingMenuPanels";

type FloatingMenuPanels = ReturnType<typeof useFloatingMenuPanels>;
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

/** Chinese lookup actions: save, listen, important note, detail drawer and panel toggles. */
export function FloatingMenuLookupToolbar({
 smartData,
 isSaving,
 hasLookupTarget,
 isNoteOpen,
 onSave,
 onSpeak,
 onToggleNote,
 onOpenDetail,
 linkSearch,
 inlineNote,
}: {
 smartData: ReturnType<typeof useSmartSelectionInsights>["data"];
 isSaving: boolean;
 hasLookupTarget: boolean;
 isNoteOpen: boolean;
 onSave: ButtonClickHandler;
 onSpeak: ButtonClickHandler;
 onToggleNote: ButtonClickHandler;
 onOpenDetail: ButtonClickHandler;
 linkSearch: FloatingMenuPanels["linkSearch"];
 inlineNote: FloatingMenuPanels["inlineNote"];
}) {
 return (
  <div className="flex items-center justify-between gap-1 border-b border-border-default/40 pb-1.5">
   <div className="flex items-center gap-1">
    <Button
     variant="ghost"
     size="icon-toolbar"
     onMouseDown={preserveEditorSelection}
     onClick={onSave}
     disabled={isSaving || !smartData || smartData.isSaved}
     aria-label={smartData?.isSaved ? "Đã lưu" : "Lưu vào kho ôn tập"}
     title={smartData?.isSaved ? "Đã lưu" : "Lưu"}
    >
     {isSaving ? (
      <Loader2 className="animate-spin" />
     ) : smartData?.isSaved ? (
      <Check className="text-success-text" />
     ) : (
      <BookmarkPlus />
     )}
    </Button>
    <Button
     variant="ghost"
     size="icon-toolbar"
     onMouseDown={preserveEditorSelection}
     onClick={onSpeak}
     disabled={!hasLookupTarget}
     aria-label="Nghe selection"
     title="Nghe"
    >
     <Volume2 />
    </Button>
    <Button
     variant={isNoteOpen ? "warning" : "ghost"}
     size="icon-toolbar"
     aria-pressed={isNoteOpen}
     onMouseDown={preserveEditorSelection}
     onClick={onToggleNote}
     aria-label="Ghi chú quan trọng"
     title="Ghi chú quan trọng"
    >
     <NotebookPen />
    </Button>
    <Button
     variant="ghost"
     size="toolbar"
     onMouseDown={preserveEditorSelection}
     onClick={onOpenDetail}
     disabled={!hasLookupTarget}
    >
     Chi tiết
     <ChevronRight data-icon="inline-end" />
    </Button>
   </div>

   <div className="flex items-center gap-1">
    <NoteLinkToggleButtons linkSearch={linkSearch} inlineNote={inlineNote} />
   </div>
  </div>
 );
}
