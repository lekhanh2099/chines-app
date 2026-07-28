"use client";

import { Editor } from "@/components/editor/Editor";

import { useDebouncedEditorSave } from "./useDebouncedEditorSave";

export function LessonReadingPane({
 noteId,
 readingContent,
 onSave,
 readOnly,
 toolbarVisible,
 className = "",
}: {
 noteId: string;
 readingContent: Record<string, unknown>;
 onSave: (content: Record<string, unknown>) => void;
 readOnly: boolean;
 toolbarVisible: boolean;
 className?: string;
}) {
 const debouncedSave = useDebouncedEditorSave({
  initialContent: readingContent,
  onSave,
 });

 return (
  <section className={className}>
   <div className="border-b border-info/20 bg-info-subtle px-4 py-2 text-xs font-black uppercase tracking-wide text-info-text">
    Bài đọc
   </div>
   <div className="lesson-note-pane-content">
    <Editor
     key={`lesson-reading-${noteId}`}
     initialContent={readingContent}
     onChange={debouncedSave}
     readOnly={readOnly}
     toolbarVisible={toolbarVisible}
     seamless
    />
   </div>
  </section>
 );
}
