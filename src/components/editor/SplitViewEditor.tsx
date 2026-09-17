/**
 * SplitViewEditor — Dual-pane editor with reading passage (left) and notes (right).
 *
 * Left pane: Full editor for lesson/reading content with highlight support.
 * Right pane: Standard note editor (100% same as current).
 * Resizable divider between panes.
 */
"use client";

import type { JsonObject } from "@/types/json";
import type { CSSProperties } from "react";
import { useCallback, useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { Editor } from "./Editor";
import { ResizableDivider } from "./ResizableDivider";
import { splitViewStore } from "@/stores/split-view-store";
import { z } from "zod";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

interface SplitViewEditorProps {
 noteId: string;
 /** Note content (right pane) */
 noteContent: Nullable<JsonObject>;
 /** Reading content (left pane) */
 readingContent: Nullable<JsonObject>;
 /** Called when note content changes */
 onNoteChange?: (json: JsonObject) => void;
 /** Called when reading content changes */
 onReadingChange?: (json: JsonObject) => void;
 readOnly?: boolean;
 toolbarVisible?: boolean;
}

type SplitViewStyle = CSSProperties & {
 "--split-pane-leading-size": string;
 "--split-pane-trailing-size": string;
};

export function SplitViewEditor({
 noteId,
 noteContent,
 readingContent,
 onNoteChange,
 onReadingChange,
 readOnly = false,
 toolbarVisible = true,
}: SplitViewEditorProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const dividerPositions = useSelector(splitViewStore, (state) => state.dividerPositions);
 const dividerPosition = dividerPositions[noteId] ?? 50;
 const { setDividerPosition } = splitViewStore.actions;
 const splitStyle: SplitViewStyle = {
  "--split-pane-leading-size": `${dividerPosition}%`,
  "--split-pane-trailing-size": `${100 - dividerPosition}%`,
 };

 const handleResize = useCallback(
  (percent: number) => {
   setDividerPosition(noteId, percent);
  },
  [noteId, setDividerPosition],
 );

 return (
  <div ref={containerRef} className="split-view-container" style={splitStyle}>
   {/* Left Pane — Reading / Lesson Passage */}
   <div className="split-view-pane split-view-pane-left">
    <div className="split-view-pane-content">
     <Editor
      initialContent={readingContent}
      onChange={onReadingChange}
      readOnly={readOnly}
      toolbarVisible={toolbarVisible}
      seamless
     />
    </div>
   </div>

   {/* Divider */}
   <ResizableDivider value={dividerPosition} onResize={handleResize} containerRef={containerRef} />

   {/* Right Pane — Personal Notes */}
   <div className="split-view-pane split-view-pane-right">
    <div className="split-view-pane-content">
     <Editor
      initialContent={noteContent}
      onChange={onNoteChange}
      readOnly={readOnly}
      toolbarVisible={toolbarVisible}
      seamless
     />
    </div>
   </div>
  </div>
 );
}
