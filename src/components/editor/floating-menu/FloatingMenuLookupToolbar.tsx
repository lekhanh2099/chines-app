"use client";

import { ChevronRight, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { NoteLinkToggleButtons } from "./NoteLinkToggleButtons";
import { preserveEditorSelection } from "./preserve-editor-selection";
import type { useFloatingMenuPanels } from "./useFloatingMenuPanels";

type FloatingMenuPanels = ReturnType<typeof useFloatingMenuPanels>;
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

/** Chinese lookup actions: listen, detail drawer and panel toggles. */
export function FloatingMenuLookupToolbar({
 hasLookupTarget,
 onSpeak,
 onOpenDetail,
 linkSearch,
 inlineNote,
}: {
 hasLookupTarget: boolean;
 onSpeak: ButtonClickHandler;
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
     onClick={onSpeak}
     disabled={!hasLookupTarget}
     aria-label="Nghe selection"
     title="Nghe"
    >
     <Volume2 />
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
