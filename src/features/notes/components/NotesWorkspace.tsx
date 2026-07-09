"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuickNoteButton } from "@/components/notes/QuickNoteButton";
import { WorkspaceCommandHeader } from "@/components/layout/workspace-command-header";
import { useHanziHomeCatalogData } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import type { NoteListItem } from "@/services/notes.service";
import type { NoteCategory } from "@/types/database";
import { NewNoteStarter } from "./NewNoteStarter";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteList } from "./NoteList";
import { buildLessonLookup, getNoteContext } from "./noteContext";

type NoteFilter = "all" | "lesson" | "normal" | "quick" | NoteCategory;

const filterLabels: Array<{ value: NoteFilter; label: string }> = [
 { value: "all", label: "Tất cả" },
 { value: "lesson", label: "Theo bài" },
 { value: "normal", label: "Ghi chú thường" },
 { value: "quick", label: "Ghi chú nhanh" },
 { value: "grammar", label: "Ngữ pháp" },
 { value: "vocabulary", label: "Từ vựng" },
];

const emptyNotes: NoteListItem[] = [];

function getFilterCount(notes: NoteListItem[], filter: NoteFilter): number {
 if (filter === "all") return notes.length;
 if (filter === "lesson") {
  return notes.filter((note) => note.links.length > 0 || Boolean(note.linked_lesson_id)).length;
 }
 if (filter === "quick") {
  return notes.filter((note) => note.tags.includes("quick-note")).length;
 }
 if (filter === "normal") {
  return notes.filter(
   (note) => note.links.length === 0 && !note.linked_lesson_id && !note.tags.includes("quick-note"),
  ).length;
 }
 return notes.filter((note) => note.category === filter).length;
}

function matchesFilter(note: NoteListItem, filter: NoteFilter): boolean {
 if (filter === "all") return true;
 if (filter === "lesson") return note.links.length > 0 || Boolean(note.linked_lesson_id);
 if (filter === "quick") return note.tags.includes("quick-note");
 if (filter === "normal") {
  return note.links.length === 0 && !note.linked_lesson_id && !note.tags.includes("quick-note");
 }
 return note.category === filter;
}

export function NotesWorkspace() {
 const [searchQuery, setSearchQuery] = useState("");
 const [activeFilter, setActiveFilter] = useState<NoteFilter>("all");
 const deferredSearchQuery = useDeferredValue(searchQuery);
 const searchParams = useSearchParams();
 const isNewAction = searchParams.get("action") === "new";

 const { data: notes, isLoading } = useNotesList();
 const catalog = useHanziHomeCatalogData({ includeLessons: true });
 const allNotes = notes ?? emptyNotes;
 const lessonLookup = useMemo(() => buildLessonLookup(catalog.lessons), [catalog.lessons]);

 const filteredNotes = useMemo(() => {
  const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

  return allNotes.filter((note) => {
   if (!matchesFilter(note, activeFilter)) return false;
   if (!normalizedSearch) return true;

   const context = getNoteContext(note, lessonLookup);
   const searchableText = [
    note.title,
    note.category,
    context.title,
    context.subtitle,
    context.relationLabel,
    ...note.tags,
   ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

   return searchableText.includes(normalizedSearch);
  });
 }, [activeFilter, allNotes, deferredSearchQuery, lessonLookup]);

 if (isNewAction) return <NewNoteStarter />;

 if (isLoading) {
  return (
   <div className="flex h-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
   </div>
  );
 }

 return (
  <div className="flex h-[calc(100dvh_-_3.5rem_-_88px_-_env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden bg-bg-primary md:h-[calc(100dvh_-_3.5rem)]">
   <WorkspaceCommandHeader
    title="Ghi chú"
    badge={
     <Badge variant="purple" size="sm">
      {allNotes.length} note
     </Badge>
    }
    description="Quản lý ghi chú theo bài học, ghi chú nhanh và ghi chú tự do trong một nơi."
    controls={
     <>
      <div className="relative min-w-56 flex-[1_1_18rem]">
       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
       <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="Tìm ghi chú theo tiêu đề, bài học hoặc tag"
        placeholder="Tìm tiêu đề, bài học, tag..."
        className="h-11 rounded-xl bg-bg-primary pl-9 shadow-theme-sm"
       />
      </div>
      <QuickNoteButton
       variant="outline"
       className="h-11 flex-1 rounded-xl bg-bg-card px-3 shadow-theme-sm sm:flex-none"
      />
      <NoteImportButton className="flex-1 sm:flex-none" />
      <NoteCreateDialog triggerClassName="flex-1 sm:flex-none" />
     </>
    }
   >
    <div className="flex snap-x snap-proximity gap-1 overflow-x-auto rounded-2xl border border-border-default bg-bg-primary p-1 scrollbar-none">
     {filterLabels.map((filter) => {
      const isActive = activeFilter === filter.value;
      const count = getFilterCount(allNotes, filter.value);

      return (
       <Button
        key={filter.value}
        type="button"
        variant={isActive ? "active" : "ghost"}
        size="default"
        className="min-h-10 snap-start gap-2 rounded-xl px-3"
        aria-pressed={isActive}
        onClick={() => setActiveFilter(filter.value)}
       >
        {filter.label}
        <span
         className={
          isActive
           ? "rounded-full bg-primary-foreground/20 px-1.5 text-[0.65rem]"
           : "rounded-full bg-bg-subtle px-1.5 text-[0.65rem] text-text-muted"
         }
        >
         {count}
        </span>
       </Button>
      );
     })}
    </div>
   </WorkspaceCommandHeader>

   <NoteList notes={filteredNotes} lessonLookup={lessonLookup} />
  </div>
 );
}
