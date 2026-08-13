"use client";

import { Typography } from "@/components/ui/typography";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useSelector } from "@tanstack/react-store";
import { useRouter } from "next/navigation";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { noteTabsStore } from "@/stores/note-tabs-store";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import type { NoteListItem } from "@/services/notes.service";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbSeparator,
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
import { z } from "zod";

const OpenNoteTabDetailSchema = z.object({
 noteId: z.string(),
 noteTitle: z.string(),
});
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

interface NoteTabContainerProps {
 /** If provided, ensure this note is opened + active on mount */
 initialNoteId?: string;
 initialTitle?: string;
}

export function NoteTabContainer({ initialNoteId, initialTitle }: NoteTabContainerProps) {
 const tabs = useSelector(noteTabsStore, (state) => state.tabs);
 const activeNoteId = useSelector(noteTabsStore, (state) => state.activeNoteId);
 const hasHydrated = useSelector(noteTabsStore, (state) => state.hasHydrated);
 const { hydrate: hydrateTabs, openTab } = noteTabsStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setContent: setHeaderToolbar, clearContent: clearHeaderToolbar } =
  headerToolbarStore.actions;
 const { data: notes } = useNotesList();
 const router = useRouter();
 const hadTabsRef = useRef(false);
 const [mobileHeaderActionsContainer, setMobileHeaderActionsContainer] =
  useState<Nullable<HTMLDivElement>>(null);
 const [desktopActionsContainer, setDesktopActionsContainer] =
  useState<Nullable<HTMLDivElement>>(null);

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
    actionsRef={setMobileHeaderActionsContainer}
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
 }, [initialNoteId]); // oxlint-disable-line react-hooks-eslint/exhaustive-deps

 // Listen for open-note-tab custom events (from InternalLinkNode etc.)
 useEffect(() => {
  const handler = (e: Event) => {
   if (!(e instanceof CustomEvent)) return;
   const detail = OpenNoteTabDetailSchema.safeParse(e.detail);
   if (!detail.success) return;
   const { noteId, noteTitle } = detail.data;
   if (noteId) {
    if (focusModeEnabled && !noteTabsStore.get().tabs.some((tab) => tab.noteId === noteId)) {
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
  return <NoteEditorSkeleton showTabBar className="h-full" />;
 }

 if (tabs.length === 0) {
  return (
   <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg-primary text-text-muted">
    <FileText className="size-10 opacity-40" />
    <Typography as="p" variant="bodySmall">
     Chọn một ghi chú để bắt đầu
    </Typography>
   </div>
  );
 }

 return (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-primary">
   <NoteTabBar
    actionsRef={setDesktopActionsContainer}
    focusLocked={focusModeEnabled}
    onCreateNote={() => router.push("/notes?action=new")}
   />
   <div className="relative min-h-0 flex-1 overflow-hidden">
    {tabs.map((tab) => (
     <NoteEditorPanel
      key={tab.noteId}
      noteId={tab.noteId}
      isVisible={tab.noteId === activeNoteId}
      mobileHeaderActionsContainer={mobileHeaderActionsContainer}
      desktopActionsContainer={desktopActionsContainer}
     />
    ))}
   </div>
  </div>
 );
}

type SelectableNote = {
 id: NoteListItem["id"];
 title: NoteListItem["title"];
 updated_at: NoteListItem["updated_at"];
};

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
 actionsRef,
}: {
 notes: SelectableNote[];
 selectedNoteId: string;
 focusLocked: boolean;
 onSelectNote: (noteId: string) => void;
 actionsRef: ComponentProps<"div">["ref"];
}) {
 return (
  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
   <AppHeaderBreadcrumb
    aria-label="Điều hướng ghi chú"
    className="min-w-0 max-w-[min(12rem,48vw)] md:max-w-none"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
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
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <Select value={selectedNoteId} onValueChange={onSelectNote}>
      <SelectTrigger
       aria-label="Chọn nhanh ghi chú"
       variant="breadcrumb"
       className="w-[min(10rem,40vw)] sm:w-64 xl:w-[24rem]"
      >
       <SelectValue placeholder="Chọn ghi chú" />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[min(32rem,calc(100vw-2rem))] text-sm">
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
   <div ref={actionsRef} className="flex shrink-0 items-center xl:hidden" />
  </div>
 );
}
