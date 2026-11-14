"use client";

import { Link2, StickyNote } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { preserveEditorSelection } from "./preserve-editor-selection";
import type { useFloatingMenuPanels } from "./useFloatingMenuPanels";

type FloatingMenuPanels = ReturnType<typeof useFloatingMenuPanels>;

/** Note-link search and inline-note toggles, shown in either toolbar row. */
export function NoteLinkToggleButtons({
 linkSearch,
 inlineNote,
}: {
 linkSearch: FloatingMenuPanels["linkSearch"];
 inlineNote: FloatingMenuPanels["inlineNote"];
}) {
 return (
  <>
   <Button
    variant={linkSearch.isOpen ? "active" : "ghost"}
    size="icon-toolbar"
    aria-pressed={linkSearch.isOpen}
    onMouseDown={preserveEditorSelection}
    onClick={linkSearch.toggle}
    aria-label="Liên kết ghi chú"
    title="Liên kết ghi chú (Ctrl+K)"
   >
    <Link2 />
   </Button>
   <Button
    variant={inlineNote.isOpen ? "warning" : "ghost"}
    size="icon-toolbar"
    aria-pressed={inlineNote.isOpen}
    onMouseDown={preserveEditorSelection}
    onClick={inlineNote.toggle}
    aria-label="Ghi chú nhanh"
    title="Ghi chú nhanh"
   >
    <StickyNote />
   </Button>
  </>
 );
}
