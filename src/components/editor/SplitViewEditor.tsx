/**
 * SplitViewEditor — Dual-pane editor with reading passage (left) and notes (right).
 *
 * Left pane: Full editor for lesson/reading content with highlight support.
 * Right pane: Standard note editor (100% same as current).
 * Resizable divider between panes.
 */
"use client";

import { useCallback, useRef } from "react";
import { Editor } from "./Editor";
import { ResizableDivider } from "./ResizableDivider";
import { useSplitViewStore } from "@/stores/split-view-store";
import { BookOpen, FileText } from "lucide-react";

interface SplitViewEditorProps {
 noteId: string;
 /** Note content (right pane) */
 noteContent: Record<string, unknown> | null;
 /** Reading content (left pane) */
 readingContent: Record<string, unknown> | null;
 /** Called when note content changes */
 onNoteChange?: (json: Record<string, unknown>) => void;
 /** Called when reading content changes */
 onReadingChange?: (json: Record<string, unknown>) => void;
}

export function SplitViewEditor({
 noteId,
 noteContent,
 readingContent,
 onNoteChange,
 onReadingChange,
}: SplitViewEditorProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const dividerPosition = useSplitViewStore((s) => s.getDividerPosition(noteId));
 const setDividerPosition = useSplitViewStore((s) => s.setDividerPosition);

 const handleResize = useCallback(
  (percent: number) => {
   setDividerPosition(noteId, percent);
  },
  [noteId, setDividerPosition],
 );

 return (
  <div ref={containerRef} className="split-view-container">
   {/* Left Pane — Reading / Lesson Passage */}
   <div
    className="split-view-pane split-view-pane-left"
    style={{ width: `${dividerPosition}%` }}
   >
    <div className="split-view-pane-header">
     <BookOpen className="w-3.5 h-3.5" />
     <span>Bài đọc</span>
    </div>
    <div className="split-view-pane-content">
     <Editor
      initialContent={readingContent}
      onChange={onReadingChange}
      seamless
     />
    </div>
   </div>

   {/* Divider */}
   <ResizableDivider onResize={handleResize} containerRef={containerRef} />

   {/* Right Pane — Personal Notes */}
   <div
    className="split-view-pane split-view-pane-right"
    style={{ width: `${100 - dividerPosition}%` }}
   >
    <div className="split-view-pane-header">
     <FileText className="w-3.5 h-3.5" />
     <span>Ghi chú</span>
    </div>
    <div className="split-view-pane-content">
     <Editor initialContent={noteContent} onChange={onNoteChange} seamless />
    </div>
   </div>
  </div>
 );
}
