"use client";

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import { z } from "zod";
import { Editor } from "@/components/editor/Editor";

import { useDebouncedEditorSave } from "./useDebouncedEditorSave";

export function PersonalNotePane({
 noteId,
 content,
 onSave,
 readOnly,
 toolbarVisible,
 className = "",
}: {
 noteId: string;
 content: z.infer<z.ZodNullable<typeof JsonObjectSchema>>;
 onSave: (content: JsonObject) => void;
 readOnly: boolean;
 toolbarVisible: boolean;
 className?: string;
}) {
 const debouncedSave = useDebouncedEditorSave({
  initialContent: content,
  onSave,
 });

 return (
  <section className={className}>
   <div className="lesson-note-pane-content">
    <Editor
     key={`lesson-note-${noteId}`}
     initialContent={content}
     onChange={debouncedSave}
     readOnly={readOnly}
     toolbarVisible={toolbarVisible}
     seamless
    />
   </div>
  </section>
 );
}
