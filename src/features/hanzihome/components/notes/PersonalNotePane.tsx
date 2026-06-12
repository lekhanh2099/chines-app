"use client";

import { Editor } from "@/components/editor/Editor";

export function PersonalNotePane({
 noteId,
 content,
 onSave,
 className = "",
}: {
 noteId: string;
 content: Record<string, unknown> | null;
 onSave: (content: Record<string, unknown>) => void;
 className?: string;
}) {
 return (
  <section className={className}>
   <div className="border-b border-warning/20 bg-warning-subtle px-4 py-2 text-xs font-black uppercase tracking-wide text-warning-text">
    Ghi chú
   </div>
   <Editor
    key={`lesson-note-${noteId}`}
    initialContent={content}
    onChange={onSave}
    seamless
   />
  </section>
 );
}
