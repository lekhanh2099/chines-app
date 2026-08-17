"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useSelector } from "@tanstack/react-store";
import { ArrowLeft, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/app-header-breadcrumb";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { NoteEditorSkeleton } from "@/components/notes/NoteEditorSkeleton";
import { NoteTabBar } from "@/components/notes/NoteTabBar";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { NoteListItem } from "@/services/notes.service";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
import { noteTabsStore } from "@/stores/note-tabs-store";

const OpenNoteTabDetailSchema = z.object({
 noteId: z.string(),
 noteTitle: z.string(),
});

interface NoteTabContainerProps {
 /** If provided, ensure this note is opened + active on mount */
 initialNoteId?: string;
 initialTitle?: string;
}

export function NoteTabContainer({ initialNoteId, initialTitle }: NoteTabContainerProps) {
 const t = useTranslations("Notes.tabs");
 const tabs = useSelector(noteTabsStore, (state) => state.tabs);
 const activeNoteId = useSelector(noteTabsStore, (state) => state.activeNoteId);
 const hasHydrated = useSelector(noteTabsStore, (state) => state.hasHydrated);
 const { hydrate: hydrateTabs, openTab } = noteTabsStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setContent: setHeaderToolbar, clearContent: clearHeaderToolbar } =
  headerToolbarStore.actions;
 const { data: notes } = useNotesList();
 const router = useRouter();
 const pathname = usePathname();
 const hadTabsRef = useRef(false);
 const [mobileHeaderActionsContainer, setMobileHeaderActionsContainer] =
  useState<HTMLDivElement | null>(null);
 const [desktopActionsContainer, setDesktopActionsContainer] = useState<HTMLDivElement | null>(
  null,
 );

 const selectableNotes = useMemo(
  () =>
   focusModeEnabled
    ? tabs.map((tab) => ({
       id: tab.noteId,
       title: tab.title || t("untitled"),
       updated_at: "",
      }))
    : mergeSelectableNotes(notes ?? [], tabs, t("untitled")),
  [focusModeEnabled, notes, t, tabs],
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
      toast.warning(t("focusSelectBlocked"));
      return;
     }
     openTab(noteId, note?.title || t("untitled"));
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
  t,
  tabs,
 ]);

 useEffect(() => {
  hydrateTabs();
 }, [hydrateTabs]);

 useEffect(() => {
  if (tabs.length > 0) hadTabsRef.current = true;
 }, [tabs.length]);

 useEffect(() => {
  if (initialNoteId) {
   openTab(initialNoteId, initialTitle);
  }
  // Only run on mount or when the noteId changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [initialNoteId]); // oxlint-disable-line react-hooks-eslint/exhaustive-deps

 useEffect(() => {
  const handler = (event: Event) => {
   if (!(event instanceof CustomEvent)) return;
   const detail = OpenNoteTabDetailSchema.safeParse(event.detail);
   if (!detail.success) return;
   const { noteId, noteTitle } = detail.data;
   if (!noteId) return;

   if (focusModeEnabled && !noteTabsStore.get().tabs.some((tab) => tab.noteId === noteId)) {
    toast.warning(t("focusOpenBlocked"));
    return;
   }

   openTab(noteId, noteTitle);
   router.replace(`/notes/${noteId}`, { scroll: false });
  };
  window.addEventListener("open-note-tab", handler);
  return () => window.removeEventListener("open-note-tab", handler);
 }, [focusModeEnabled, openTab, router, t]);

 useEffect(() => {
  if (!activeNoteId) return;
  const expected = `/notes/${activeNoteId}`;
  if (pathname !== expected) {
   router.replace(expected, { scroll: false });
  }
 }, [activeNoteId, pathname, router]);

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
     {t("empty")}
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
 untitled: string,
) {
 const notesById = new Map<string, SelectableNote>();

 for (const note of notes) {
  notesById.set(note.id, {
   id: note.id,
   title: note.title || untitled,
   updated_at: note.updated_at,
  });
 }

 for (const tab of tabs) {
  if (!notesById.has(tab.noteId)) {
   notesById.set(tab.noteId, {
    id: tab.noteId,
    title: tab.title || untitled,
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
 const t = useTranslations("Notes.tabs");

 return (
  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
   <AppHeaderBreadcrumb
    aria-label={t("navigation")}
    className="min-w-0 max-w-[min(12rem,48vw)] md:max-w-none"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink
      href="/notes"
      disabled={focusLocked}
      icon={<ArrowLeft className="h-4 w-4" />}
      title={focusLocked ? t("focusBlocksLeave") : t("back")}
      className="max-w-[9rem]"
     >
      {t("back")}
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0">
     <Select value={selectedNoteId} onValueChange={onSelectNote}>
      <SelectTrigger
       aria-label={t("quickSelect")}
       variant="breadcrumb"
       className="w-[min(10rem,40vw)] sm:w-64 xl:w-[24rem]"
      >
       <SelectValue placeholder={t("selectPlaceholder")} />
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
