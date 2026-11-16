"use client";

import { Highlighter, Languages, StickyNote } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import { Button } from "@/components/ui/actions/button";

import type { useLessonAnnotationSelection } from "./useLessonAnnotationSelection";

export function LessonAnnotationSelectionMenu({
 open,
 anchor,
 onClose,
 onLookup,
 onHighlight,
 onNote,
}: {
 open: boolean;
 anchor: ReturnType<typeof useLessonAnnotationSelection>["selectionAnchor"];
 onClose: () => void;
 onLookup: () => void;
 onHighlight: () => Promise<void>;
 onNote: () => void;
}) {
 return (
  <Popover.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} modal={false}>
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={anchor}
     side="top"
     align="center"
     sideOffset={10}
     collisionPadding={8}
     positionMethod="fixed"
    >
     <BasePopoverPopup variant="actions" initialFocus={false} finalFocus={false} data-no-inspector>
      <Button size="sm" variant="ghost" onClick={onLookup}>
       <Languages />
       Tra từ
      </Button>
      <Button size="sm" variant="ghost" onClick={onHighlight}>
       <Highlighter />
       Highlight
      </Button>
      <Button size="sm" variant="ghost" onClick={onNote}>
       <StickyNote />
       Ghi chú
      </Button>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
