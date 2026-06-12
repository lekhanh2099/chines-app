"use client";

import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { useNoteTabsStore } from "@/stores/note-tabs-store";

export function InlineRichContent() {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);

 return (
  <div>
   {tabs.map((tab) => (
    <NoteEditorPanel key={tab.noteId} noteId={tab.noteId} isVisible={tab.noteId === activeNoteId} />
   ))}
  </div>
 );
}
