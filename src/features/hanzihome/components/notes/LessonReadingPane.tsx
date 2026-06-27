"use client";

import { Editor } from "@/components/editor/Editor";

import { useDebouncedEditorSave } from "./useDebouncedEditorSave";

export function LessonReadingPane({
 noteId,
 readingContent,
 onSave,
 className = "",
}: {
 noteId: string;
 readingContent: Record<string, unknown>;
 onSave: (content: Record<string, unknown>) => void;
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
   <Editor
    key={`lesson-reading-${noteId}`}
    initialContent={readingContent}
    onChange={debouncedSave}
    seamless
   />
  </section>
 );
}
