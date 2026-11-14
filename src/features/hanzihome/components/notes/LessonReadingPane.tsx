"use client";

import type { JsonObject } from "@/types/json";
import { Editor } from "@/components/editor/Editor";

export function LessonReadingPane({
 noteId,
 readingContent,
 onSave,
 readOnly,
 toolbarVisible,
 className = "",
}: {
 noteId: string;
 readingContent: JsonObject;
 onSave: (content: JsonObject) => void;
 readOnly: boolean;
 toolbarVisible: boolean;
 className?: string;
}) {
 return (
  <section className={className}>
   <div className="lesson-note-pane-content">
    <Editor
     key={`lesson-reading-${noteId}`}
     initialContent={readingContent}
     onChange={onSave}
     readOnly={readOnly}
     toolbarVisible={toolbarVisible}
     seamless
    />
   </div>
  </section>
 );
}
