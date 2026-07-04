"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import type { NoteListItem } from "@/services/notes.service";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";

interface NoteTabContainerProps {
 /** If provided, ensure this note is opened + active on mount */
 initialNoteId?: string;
 initialTitle?: string;
}

export function NoteTabContainer({ initialNoteId, initialTitle }: NoteTabContainerProps) {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);
 const hydrateTabs = useNoteTabsStore((s) => s.hydrate);
 const openTab = useNoteTabsStore((s) => s.openTab);
 const { data: notes } = useNotesList();
 const router = useRouter();
 const hadTabsRef = useRef(false);

 const selectableNotes = useMemo(
  () => mergeSelectableNotes(notes ?? [], tabs),
  [notes, tabs],
 );

 const selectedNoteId = activeNoteId ?? tabs[0]?.noteId ?? "";

 useEffect(() => {
  hydrateTabs();
 }, [hydrateTabs]);

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
   <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center bg-bg-primary text-text-muted">
    <FileText className="w-10 h-10 mb-3 opacity-40" />
    <p className="text-sm">Chọn một ghi chú để bắt đầu</p>
   </div>
  );
 }

 return (
  <div className="flex h-[calc(100dvh_-_3.5rem_-_88px_-_env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden bg-bg-primary md:h-[calc(100dvh_-_3.5rem)]">
   <NoteTabBar
    leading={
     <NoteQuickSelect
      notes={selectableNotes}
      selectedNoteId={selectedNoteId}
      onSelectNote={(noteId) => {
       const note = selectableNotes.find((item) => item.id === noteId);
       openTab(noteId, note?.title || "Ghi chú chưa đặt tên");
      }}
     />
    }
    trailing={
     <span className="text-xs font-semibold text-text-muted">
      {selectableNotes.length > 0 ? `${selectableNotes.length} ghi chú` : "Đang tải..."}
     </span>
    }
   />
   <div className="relative min-h-0 flex-1 overflow-hidden">
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

type SelectableNote = Pick<NoteListItem, "id" | "title" | "updated_at">;

function mergeSelectableNotes(notes: NoteListItem[], tabs: Array<{ noteId: string; title: string }>) {
 const notesById = new Map<string, SelectableNote>();

 for (const note of notes) {
  notesById.set(note.id, {
   id: note.id,
   title: note.title || "Ghi chú chưa đặt tên",
   updated_at: note.updated_at,
  });
 }

 for (const tab of tabs) {
  if (!notesById.has(tab.noteId)) {
   notesById.set(tab.noteId, {
    id: tab.noteId,
    title: tab.title || "Ghi chú chưa đặt tên",
    updated_at: "",
   });
  }
 }

 return Array.from(notesById.values());
}

function NoteQuickSelect({
 notes,
 selectedNoteId,
 onSelectNote,
}: {
 notes: SelectableNote[];
 selectedNoteId: string;
 onSelectNote: (noteId: string) => void;
}) {
 return (
  <>
   <Button asChild variant="outline" size="sm" className="rounded-xl">
    <Link href="/notes" prefetch={false}>
     <ArrowLeft className="h-4 w-4" />
     Ghi chú
    </Link>
   </Button>

   <Select value={selectedNoteId} onValueChange={onSelectNote}>
    <SelectTrigger
     aria-label="Chọn nhanh ghi chú"
     className="h-10 min-w-0 flex-1 border-border-default bg-bg-primary shadow-theme-sm sm:w-72 lg:w-96"
    >
     <SelectValue placeholder="Chọn ghi chú" />
    </SelectTrigger>
    <SelectContent align="start" className="min-w-[min(32rem,calc(100vw-2rem))]">
     {notes.map((note) => (
      <SelectItem key={note.id} value={note.id}>
       {note.title}
      </SelectItem>
     ))}
    </SelectContent>
   </Select>
  </>
 );
}
