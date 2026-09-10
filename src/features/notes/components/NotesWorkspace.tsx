"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Filter, Library } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { Typography } from "@/components/ui/typography";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useNoteFolders } from "@/features/notes/hooks/useNoteLibrary";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import {
 matchesNoteFacets,
 matchesNoteLibraryView,
 type NoteLibraryView,
} from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteListItem } from "@/services/notes.service";
import { NoteCategorySchema, type NoteCategory } from "@/types/database";

import { NewNoteStarter } from "./NewNoteStarter";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteList } from "./NoteList";
import { NotesLibraryNavigator } from "./NotesLibraryNavigator";
import { NotesWorkspaceSkeleton } from "./NotesWorkspaceSkeleton";
import { buildLessonLookup, getNoteContext } from "./noteContext";
import { useNoteContextLabels } from "./useNoteContextLabels";

const emptyNotes: NoteListItem[] = [];
const emptyFolders: NoteFolder[] = [];
type NoteCategoryFilter = NoteCategory | "all";

export function NotesWorkspace() {
 const t = useTranslations("Notes");
 const locale = useLocale();
 const contextLabels = useNoteContextLabels();
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
  () => buildLessonLookup(catalogQuery.data?.lessons ?? []),
  [catalogQuery.data?.lessons],
 );
 const folderNames = useMemo(
  () => new Map(folders.map((folder) => [folder.id, folder.name])),
  [folders],
 );
 const sourceOptions = useMemo(
  () =>
   Array.from(
    notes
     .reduce((options, note) => {
      if (!note.source_host) return options;
      options.set(note.source_host, note.source_label || note.source_host);
      return options;
     }, new Map<string, string>())
     .entries(),
   ).sort((a, b) => String(a[1]).localeCompare(String(b[1]), locale)),
  [locale, notes],
 );

 const filteredNotes = useMemo(() => {
  const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

  return notes.filter((note) => {
   if (!matchesNoteLibraryView(note, activeView)) return false;
   if (!matchesNoteFacets(note, { category, sourceHost })) return false;
   if (!normalizedSearch) return true;

   const context = getNoteContext(note, lessonLookup, contextLabels);
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
 }, [
  activeView,
  category,
  contextLabels,
  deferredSearchQuery,
  folderNames,
  lessonLookup,
  notes,
  sourceHost,
 ]);

 if (isNewAction) return <NewNoteStarter />;

 if (notesQuery.isPending || foldersQuery.isPending) {
  return <NotesWorkspaceSkeleton />;
 }

 if (notesQuery.isError || foldersQuery.isError) {
  return (
   <div className="p-4 sm:p-6">
    <QueryErrorCard
     title={t("loadError.title")}
     description={t("loadError.description")}
     onRetry={() => {
      void Promise.all([notesQuery.refetch(), foldersQuery.refetch()]);
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
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-primary">
   <WorkspaceCommandHeader
    title={t("title")}
    badge={
     <Badge variant="purple" size="sm">
      {t("count", { count: notes.length })}
     </Badge>
    }
    description={t("description")}
    controls={
     <>
      <Button
       variant="outline"
       size="icon-toolbar"
       className="xl:hidden"
       aria-label={t("openLibrary")}
       onClick={() => setNavigatorOpen(true)}
      >
       <Library />
      </Button>
      <div className="min-w-0 flex-1 md:max-w-sm">
       <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        density="compact"
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
      <Filter className="size-4" /> {t("filters.title")}
     </Typography>
     <Select
      value={category}
      onValueChange={(value) => {
       if (value === "all") {
        setCategory("all");
        return;
       }
       const nextCategory = NoteCategorySchema.safeParse(value);
       if (nextCategory.success) setCategory(nextCategory.data);
      }}
     >
      <SelectTrigger size="sm">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
       <SelectItem value="general">{t("filters.categories.general")}</SelectItem>
       <SelectItem value="grammar">{t("filters.categories.grammar")}</SelectItem>
       <SelectItem value="vocabulary">{t("filters.categories.vocabulary")}</SelectItem>
       <SelectItem value="culture">{t("filters.categories.culture")}</SelectItem>
      </SelectContent>
     </Select>
     <Select value={sourceHost} onValueChange={setSourceHost}>
      <SelectTrigger size="sm">
       <SelectValue />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">{t("filters.allSources")}</SelectItem>
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
    <SheetHeader title={t("library")} onClose={() => setNavigatorOpen(false)} />
    <SheetBody>{navigator}</SheetBody>
   </Sheet>
  </div>
 );
}
