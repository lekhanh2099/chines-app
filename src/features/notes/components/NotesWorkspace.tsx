"use client";

import { Typography } from "@/components/ui/typography";
import { useDeferredValue, useMemo, useState } from "react";
import { Filter, Library } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { WorkspaceCommandHeader } from "@/components/layout/workspace-command-header";
import { QuickNoteButton } from "@/components/notes/QuickNoteButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useNoteFolders } from "@/features/notes/hooks/useNoteLibrary";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import {
 matchesNoteFacets,
 matchesNoteLibraryView,
 type NoteLibraryView,
} from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteListItem } from "@/services/notes.service";
import { NoteCategorySchema } from "@/types/database";
import { z } from "zod";
import { NewNoteStarter } from "./NewNoteStarter";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteList } from "./NoteList";
import { NotesLibraryNavigator } from "./NotesLibraryNavigator";
import { NotesWorkspaceSkeleton } from "./NotesWorkspaceSkeleton";
import { buildLessonLookup, getNoteContext } from "./noteContext";

const emptyNotes: NoteListItem[] = [];
const emptyFolders: NoteFolder[] = [];
const NoteCategoryFilterSchema = z.union([NoteCategorySchema, z.literal("all")]);
type NoteCategoryFilter = z.infer<typeof NoteCategoryFilterSchema>;

export function NotesWorkspace() {
 const [searchQuery, setSearchQuery] = useState("");
 const [activeView, setActiveView] = useState<NoteLibraryView>("recent");
 const [category, setCategory] = useState<NoteCategoryFilter>("all");
 const [sourceHost, setSourceHost] = useState("all");
 const [navigatorOpen, setNavigatorOpen] = useState(false);
 const deferredSearchQuery = useDeferredValue(searchQuery);
 const searchParams = useSearchParams();
 const isNewAction = searchParams.get("action") === "new";

 const notesQuery = useNotesList();
 const foldersQuery = useNoteFolders();
 const catalogQuery = useHanziHomeCatalogQuery({ includeLessons: true });
 const notes = notesQuery.data ?? emptyNotes;
 const folders = foldersQuery.data ?? emptyFolders;
 const lessonLookup = useMemo(
  () => buildLessonLookup(catalogQuery.data.lessons),
  [catalogQuery.data.lessons],
 );
 const folderNames = useMemo(
  () => new Map(folders.map((folder) => [folder.id, folder.name])),
  [folders],
 );
 const sourceOptions = useMemo(
  () =>
   Array.from(
    new Map(
     notes
      .filter((note) => note.source_host)
      .map((note) => [note.source_host as string, note.source_label || note.source_host]),
    ).entries(),
   ).sort((a, b) => String(a[1]).localeCompare(String(b[1]), "vi")),
  [notes],
 );

 const filteredNotes = useMemo(() => {
  const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

  return notes.filter((note) => {
   if (!matchesNoteLibraryView(note, activeView)) return false;
   if (!matchesNoteFacets(note, { category, sourceHost })) return false;
   if (!normalizedSearch) return true;

   const context = getNoteContext(note, lessonLookup);
   const searchableText = [
    note.title,
    note.category,
    note.source_label,
    note.source_host,
    note.source_author,
    note.folder_id ? folderNames.get(note.folder_id) : null,
    context.displayTitle,
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
 }, [activeView, category, deferredSearchQuery, folderNames, lessonLookup, notes, sourceHost]);

 if (isNewAction) return <NewNoteStarter />;

 if (notesQuery.isPending || foldersQuery.isPending || catalogQuery.isPending) {
  return <NotesWorkspaceSkeleton />;
 }

 if (notesQuery.isError || foldersQuery.isError || catalogQuery.isError) {
  return (
   <div className="p-4 sm:p-6">
    <QueryErrorCard
     title="Không tải được thư viện ghi chú"
     description="Danh sách ghi chú, folder hoặc dữ liệu bài học hiện không khả dụng."
     onRetry={() => {
      void Promise.all([notesQuery.refetch(), foldersQuery.refetch(), catalogQuery.refetch()]);
     }}
    />
   </div>
  );
 }

 const navigator = (
  <NotesLibraryNavigator
   notes={notes}
   folders={folders}
   activeView={activeView}
   onViewChange={setActiveView}
   onNavigate={() => setNavigatorOpen(false)}
  />
 );

 return (
  <div className="flex h-[calc(100dvh_-_3.5rem_-_88px_-_env(safe-area-inset-bottom))] min-h-0 flex-col overflow-hidden bg-bg-primary md:h-[calc(100dvh_-_3.5rem)]">
   <WorkspaceCommandHeader
    title="Ghi chú"
    badge={
     <Badge variant="purple" size="sm">
      {notes.length} note
     </Badge>
    }
    description="Lưu bài đọc, ghi chú theo bài học và ý tưởng cá nhân trong một thư viện."
    controls={
     <>
      <Button
       variant="outline"
       size="icon-lg"
       className="xl:hidden"
       aria-label="Mở thư viện"
       onClick={() => setNavigatorOpen(true)}
      >
       <Library />
      </Button>
      <div className="min-w-0 flex-1 md:max-w-sm">
       <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="Tìm ghi chú"
        placeholder="Tìm tiêu đề, nguồn, folder, tag..."
       />
      </div>
      <QuickNoteButton variant="outline" compactOnTablet />
      <NoteImportButton compactOnTablet />
      <NoteCreateDialog compactOnTablet folders={folders} />
     </>
    }
   >
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     <Typography variant="label" tone="secondary" weight="bold" className="flex items-center gap-2">
      <Filter className="size-4" /> Bộ lọc
     </Typography>
     <Select
      value={category}
      onValueChange={(value) => {
       const nextCategory = NoteCategoryFilterSchema.safeParse(value);
       if (nextCategory.success) setCategory(nextCategory.data);
      }}
     >
      <SelectTrigger size="sm">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">Mọi danh mục</SelectItem>
       <SelectItem value="general">Chung</SelectItem>
       <SelectItem value="grammar">Ngữ pháp</SelectItem>
       <SelectItem value="vocabulary">Từ vựng</SelectItem>
       <SelectItem value="culture">Văn hóa</SelectItem>
      </SelectContent>
     </Select>
     <Select value={sourceHost} onValueChange={setSourceHost}>
      <SelectTrigger size="sm">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">Mọi nguồn</SelectItem>
       {sourceOptions.map(([host, label]) => (
        <SelectItem key={host} value={host}>
         {label}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
   </WorkspaceCommandHeader>

   <div className="grid min-h-0 flex-1 xl:grid-cols-[17rem_minmax(0,1fr)]">
    <aside className="hidden min-h-0 overflow-y-auto border-r border-border-default bg-bg-card p-3 scrollbar-soft xl:block">
     {navigator}
    </aside>
    <NoteList
     notes={filteredNotes}
     folders={folders}
     lessonLookup={lessonLookup}
     groupByMonth={activeView === "completed"}
    />
   </div>

   <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen} side="right">
    <SheetHeader title="Thư viện ghi chú" onClose={() => setNavigatorOpen(false)} />
    <SheetBody>{navigator}</SheetBody>
   </Sheet>
  </div>
 );
}
