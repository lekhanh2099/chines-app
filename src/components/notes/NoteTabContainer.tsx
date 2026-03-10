"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { FileText } from "lucide-react";

interface NoteTabContainerProps {
 /** If provided, ensure this note is opened + active on mount */
 initialNoteId?: string;
 initialTitle?: string;
}

export function NoteTabContainer({
 initialNoteId,
 initialTitle,
}: NoteTabContainerProps) {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);
 const openTab = useNoteTabsStore((s) => s.openTab);
 const router = useRouter();
 const hadTabsRef = useRef(false);

 // Track whether we've ever had tabs open
 useEffect(() => {
  if (tabs.length > 0) hadTabsRef.current = true;
 }, [tabs.length]);

 // Open the initial note as a tab
 useEffect(() => {
  if (initialNoteId) {
   openTab(initialNoteId, initialTitle);
  }
  // Only run on mount or when the noteId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [initialNoteId]);

 // Listen for open-note-tab custom events (from InternalLinkNode etc.)
 useEffect(() => {
  const handler = (e: Event) => {
   const { noteId, noteTitle } = (e as CustomEvent).detail;
   if (noteId) {
    openTab(noteId, noteTitle);
    window.history.replaceState(null, "", `/notes/${noteId}`);
   }
  };
  window.addEventListener("open-note-tab", handler);
  return () => window.removeEventListener("open-note-tab", handler);
 }, [openTab]);

 // Sync URL when activeNoteId changes (e.g. tab click, tab close)
 useEffect(() => {
  if (activeNoteId) {
   const expected = `/notes/${activeNoteId}`;
   if (window.location.pathname !== expected) {
    window.history.replaceState(null, "", expected);
   }
  }
 }, [activeNoteId]);

 // Navigate away when all tabs are closed (after having had tabs)
 useEffect(() => {
  if (tabs.length === 0 && hadTabsRef.current) {
   router.replace("/notes?view=all");
  }
 }, [tabs.length, router]);

 if (tabs.length === 0) {
  return (
   <div className="flex h-full flex-col items-center justify-center text-text-muted">
    <FileText className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm">Chọn một ghi chú để bắt đầu</p>
   </div>
  );
 }

 return (
  <div className="flex h-full flex-col">
   <NoteTabBar />
   <div className="relative flex-1 min-h-0">
    {tabs.map((tab) => (
     <NoteEditorPanel
      key={tab.noteId}
      noteId={tab.noteId}
      isVisible={tab.noteId === activeNoteId}
     />
    ))}
   </div>
  </div>
 );
}
