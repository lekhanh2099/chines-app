"use client";

import { useCallback, type ReactNode } from "react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import type { ReaderSurfaceSelection } from "@/features/reading/model/reading-interactions";
import type {
 HighlightColor,
 ReaderSelectionMode,
} from "@/features/reading/model/reader-selection-model";
import { ReaderSelectionMoreActions } from "@/features/reading/components/ReaderSelectionMoreActions";
import { ReaderSelectionNoteEditor } from "@/features/reading/components/ReaderSelectionNoteEditor";
import { ReaderSelectionQuickActions } from "@/features/reading/components/ReaderSelectionQuickActions";

export type ReaderSelectionPopoverContentProps = {
 selection: ReaderSurfaceSelection;
 mode: ReaderSelectionMode;
 selectedColor: HighlightColor;
 noteDraft: string;
 openedAnnotation?: ReaderAnnotationRow;
 saving: boolean;
 onModeChange: (mode: ReaderSelectionMode) => void;
 onSelectedColorChange: (color: HighlightColor) => void;
 onNoteDraftChange: (value: string) => void;
 onClear: () => void;
 onSaveAnnotation: (
  annotationType: ReaderAnnotationRow["annotation_type"],
  color?: HighlightColor,
 ) => void;
 onRemoveAnnotation: (annotationId: string, revision: number) => void;
 onAddToReview: () => void;
 onLookup: (selection: ReaderSurfaceSelection) => void;
 onListen: (selection: ReaderSurfaceSelection) => void;
 /** Contextual Pinyin of the selected range; empty when it cannot be resolved. */
 onPlayFromHere?: (selection: ReaderSurfaceSelection) => void;
};

/**
 * Non-modal popover root for the Reader selection menu; dismisses on outside
 * presses except the press that anchors the current selection or saved mark.
 */
export function ReaderSelectionPopoverRoot({
 open,
 onDismiss,
 children,
}: {
 open: boolean;
 onDismiss: () => void;
 children: ReactNode;
}) {
 return (
  <Popover.Root
   open={open}
   modal={false}
   onOpenChange={(nextOpen, details) => {
    if (nextOpen) return;
    const target = details.event.target;
    // The click ending a text selection (or opening a saved mark) is its anchor,
    // not an outside click dismissing the menu that just opened on mouseup.
    if (
     details.reason === "outside-press" &&
     ["click", "pointerdown", "mousedown", "touchstart"].includes(details.event.type) &&
     target instanceof Element &&
     target.closest("[data-reader-hanzi-content], [data-reader-source]") &&
     (window.getSelection()?.isCollapsed === false || target.closest(".reading-highlight"))
    )
     return;
    onDismiss();
   }}
  >
   {children}
  </Popover.Root>
 );
}

export function ReaderSelectionPopoverContent(props: ReaderSelectionPopoverContentProps) {
 const { selection, mode } = props;
 const anchor = useCallback(
  () => ({
   getBoundingClientRect: () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
     const range = sel.getRangeAt(0);
     const rect = range.getBoundingClientRect();
     if (rect.width > 0 && rect.height > 0) return rect;
    }
    return selection.rect;
   },
   contextElement: document.body,
  }),
  [selection],
 );

 return (
  <Popover.Portal>
   <BasePopoverPositioner
    anchor={anchor}
    side="top"
    align="center"
    sideOffset={8}
    collisionPadding={8}
    positionMethod="fixed"
   >
    <BasePopoverPopup
     variant={mode === "quick" ? "actions" : "default"}
     initialFocus={false}
     finalFocus={false}
     data-no-inspector
     onMouseDown={(event) => {
      if (event.target instanceof Element && event.target.closest("textarea, input")) return;
      event.preventDefault();
     }}
    >
     {mode === "quick" ? (
      <div className="flex items-center gap-1">
       <ReaderSelectionQuickActions {...props} />
      </div>
     ) : mode === "more" ? (
      <div className="grid gap-1.5 p-2 w-52">
       <ReaderSelectionMoreActions {...props} />
      </div>
     ) : (
      <div className="grid gap-2.5 p-3 w-72">
       <ReaderSelectionNoteEditor {...props} />
      </div>
     )}
    </BasePopoverPopup>
   </BasePopoverPositioner>
  </Popover.Portal>
 );
}
