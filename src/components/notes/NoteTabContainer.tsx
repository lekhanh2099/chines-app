"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { useNoteTabsStore } from "@/stores/note-tabs-store";
import { useFocusModeStore } from "@/stores/focus-mode-store";
import { useHeaderToolbarStore } from "@/stores/header-toolbar-store";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import type { NoteListItem } from "@/services/notes.service";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbSeparator,
 appHeaderBreadcrumbSelectTriggerClassName,
} from "@/components/layout/app-header-breadcrumb";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NoteTabContainerProps {
 /** If provided, ensure this note is opened + active on mount */
 initialNoteId?: string;
 initialTitle?: string;
}

export function NoteTabContainer({ initialNoteId, initialTitle }: NoteTabContainerProps) {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);
 const hasHydrated = useNoteTabsStore((s) => s.hasHydrated);
 const hydrateTabs = useNoteTabsStore((s) => s.hydrate);
 const openTab = useNoteTabsStore((s) => s.openTab);
 const focusModeEnabled = useFocusModeStore((s) => s.enabled);
 const setHeaderToolbar = useHeaderToolbarStore((s) => s.setContent);
 const clearHeaderToolbar = useHeaderToolbarStore((s) => s.clearContent);
 const { data: notes } = useNotesList();
 const router = useRouter();
 const hadTabsRef = useRef(false);
 const [headerActionsContainer, setHeaderActionsContainer] = useState<HTMLDivElement | null>(null);

 const selectableNotes = useMemo(
  () =>
   focusModeEnabled
    ? tabs.map((tab) => ({
       id: tab.noteId,
       title: tab.title || "Ghi chú chưa đặt tên",
       updated_at: "",
      }))
    : mergeSelectableNotes(notes ?? [], tabs),
  [focusModeEnabled, notes, tabs],
 );

 const selectedNoteId = activeNoteId ?? tabs[0]?.noteId ?? "";

 useEffect(() => {
  setHeaderToolbar(
   <NoteQuickSelect
    notes={selectableNotes}
    selectedNoteId={selectedNoteId}
    focusLocked={focusModeEnabled}
    onSelectNote={(noteId) => {
     const note = selectableNotes.find((item) => item.id === noteId);
     if (focusModeEnabled && !tabs.some((tab) => tab.noteId === noteId)) {
      toast.warning("Focus mode đang bật. Chỉ chọn được tab ghi chú đang mở.");
      return;
     }
     openTab(noteId, note?.title || "Ghi chú chưa đặt tên");
    }}
   />,
  );

  return () => clearHeaderToolbar();
 }, [
  clearHeaderToolbar,
  focusModeEnabled,
  openTab,
  selectableNotes,
  selectedNoteId,
  setHeaderToolbar,
  tabs,
 ]);

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
    if (
     focusModeEnabled &&
     !useNoteTabsStore.getState().tabs.some((tab) => tab.noteId === noteId)
    ) {
     toast.warning("Focus mode đang bật. Không mở thêm ghi chú mới.");
     return;
    }

    openTab(noteId, noteTitle);
    window.history.replaceState(null, "", `/notes/${noteId}`);
   }
  };
  window.addEventListener("open-note-tab", handler);
  return () => window.removeEventListener("open-note-tab", handler);
 }, [focusModeEnabled, openTab]);

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

 if (!hasHydrated || (initialNoteId && tabs.length === 0)) {
  return (
   <NoteEditorSkeleton
    showTabBar
    className="h-[calc(100dvh_-_3.5rem_-_88px_-_env(safe-area-inset-bottom))] md:h-[calc(100dvh_-_3.5rem)]"
   />
  );
 }

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
    actionsRef={setHeaderActionsContainer}
    focusLocked={focusModeEnabled}
    onCreateNote={() => router.push("/notes?action=new")}
   />
   <div className="relative min-h-0 flex-1 overflow-hidden">
    {tabs.map((tab) => (
     <NoteEditorPanel
      key={tab.noteId}
      noteId={tab.noteId}
      isVisible={tab.noteId === activeNoteId}
      headerActionsContainer={headerActionsContainer}
     />
    ))}
   </div>
  </div>
 );
}

type SelectableNote = Pick<NoteListItem, "id" | "title" | "updated_at">;

function mergeSelectableNotes(
 notes: NoteListItem[],
 tabs: Array<{ noteId: string; title: string }>,
) {
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
 focusLocked,
 onSelectNote,
}: {
 notes: SelectableNote[];
 selectedNoteId: string;
 focusLocked: boolean;
 onSelectNote: (noteId: string) => void;
}) {
 return (
  <AppHeaderBreadcrumb aria-label="Điều hướng ghi chú" className="hidden min-w-0 md:inline-flex">
   <AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbLink
     href="/notes"
     disabled={focusLocked}
     icon={<ArrowLeft className="h-4 w-4" />}
     title={focusLocked ? "Focus mode đang khóa rời khỏi ghi chú hiện tại" : "Ghi chú"}
     className="max-w-[9rem]"
    >
     Ghi chú
    </AppHeaderBreadcrumbLink>
   </AppHeaderBreadcrumbItem>
   <AppHeaderBreadcrumbSeparator />
   <AppHeaderBreadcrumbItem className="min-w-0">
    <Select value={selectedNoteId} onValueChange={onSelectNote}>
     <SelectTrigger
      aria-label="Chọn nhanh ghi chú"
      className={cn(
       appHeaderBreadcrumbSelectTriggerClassName,
       "w-[min(14rem,42vw)] sm:w-64 xl:w-[24rem]",
      )}
     >
      <SelectValue placeholder="Chọn ghi chú" />
     </SelectTrigger>
     <SelectContent align="start" className="min-w-[min(32rem,calc(100vw-2rem))]">
      <SelectGroup>
       {notes.map((note) => (
        <SelectItem key={note.id} value={note.id}>
         {note.title}
        </SelectItem>
       ))}
      </SelectGroup>
     </SelectContent>
    </Select>
   </AppHeaderBreadcrumbItem>
  </AppHeaderBreadcrumb>
 );
}
