"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Filter, Library } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { WorkspaceCommandHeader } from "@/components/layout/workspace/workspace-command-header";
import { QuickNoteButton } from "@/components/notes/QuickNoteButton";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import { Typography } from "@/components/ui/display/typography";
import { useHanziHomeCatalogQuery } from "@/features/hanzihome/hooks/useHanziHomeCatalogData";
import { useNoteFolders } from "@/features/notes/hooks/useNoteLibrary";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { useCreateQuickNote } from "@/features/notes/hooks/useCreateNote";
import { formatQuickNoteDate } from "@/features/notes/note-editor-utils";
import { useRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import {
 filterNoteLibrary,
 getNoteLibrarySources,
 getNoteLibraryNavigationAfterFolderDelete,
} from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";
import { NoteCategorySchema, type NoteCategory } from "@/types/database";

import { NewNoteStarter } from "./NewNoteStarter";
import { NoteCreateDialog } from "./NoteCreateDialog";
import { NoteImportButton } from "./NoteImportButton";
import { NoteList } from "./NoteList";
import { NotesLibraryNavigator } from "./NotesLibraryNavigator";
import { NotesWorkspaceSkeleton } from "./NotesWorkspaceSkeleton";
import { buildLessonLookup } from "./noteContext";
import { useNoteContextLabels } from "./useNoteContextLabels";

const emptyNotes: NoteListItem[] = [];
const emptyFolders: NoteFolder[] = [];
type NoteCategoryFilter = NoteCategory | "all";

export function NotesWorkspace() {
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const locale = useLocale();
 const router = useRouter();
 const quickNote = useCreateQuickNote();
 const createQuickNote = async () => {
  if (quickNote.isPending) return;
  if (focusModeStore.get().enabled) {
   toast.warning(t("quick.focusBlocked"));
   return;
  }
  try {
   const note = await quickNote.mutateAsync(() =>
    t("quick.defaultTitle", { date: formatQuickNoteDate(new Date(), locale) }),
   );
   router.push(note ? `/notes/${note.id}` : "/login");
  } catch {
   toast.error(t("quick.error"));
  }
 };
 const contextLabels = useNoteContextLabels();
 const [searchQuery, setSearchQuery] = useState("");
 const [navigation, setNavigation] = useState<
  Parameters<typeof getNoteLibraryNavigationAfterFolderDelete>[0]
 >({ activeView: "recent", page: 1 });
 const { activeView, page } = navigation;
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
 const sourceOptions = useMemo(() => getNoteLibrarySources(notes, locale), [locale, notes]);

 const filteredNotes = useMemo(
  () =>
   filterNoteLibrary(notes, {
    view: activeView,
    category,
    sourceHost,
    searchQuery: deferredSearchQuery,
    lessonLookup,
    contextLabels,
    folderNames,
   }),
  [
   activeView,
   category,
   contextLabels,
   deferredSearchQuery,
   folderNames,
   lessonLookup,
   notes,
   sourceHost,
  ],
 );

 if (isNewAction) return <NewNoteStarter />;

 if (notesQuery.isPending || foldersQuery.isPending) {
  return <NotesWorkspaceSkeleton />;
 }

 const libraryError =
  notesQuery.isError || foldersQuery.isError ? (
   <div className="shrink-0 p-4 sm:p-6">
    <QueryErrorCard
     title={t("loadError.title")}
     description={t("loadError.description")}
     retryLabel={common("actions.retry")}
     onRetry={() => {
      void Promise.all([notesQuery.refetch(), foldersQuery.refetch()]);
     }}
    />
   </div>
  ) : null;
 if (libraryError && (!notesQuery.data || !foldersQuery.data)) return libraryError;

 const navigator = (
  <NotesLibraryNavigator
   notes={notes}
   folders={folders}
   activeView={activeView}
   onViewChange={(view) => {
    setNavigation({ activeView: view, page: 1 });
   }}
   onFolderDeleted={(folderId) => {
    setNavigation((current) => getNoteLibraryNavigationAfterFolderDelete(current, folderId));
   }}
   onNavigate={() => setNavigatorOpen(false)}
  />
 );

 return (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-primary">
   {libraryError}
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
        onChange={(event) => {
         setSearchQuery(event.target.value);
         setNavigation((current) => ({ ...current, page: 1 }));
        }}
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        density="compact"
       />
      </div>
      <QuickNoteButton
       variant="outline"
       compactOnTablet
       isCreating={quickNote.isPending}
       onCreate={() => void createQuickNote()}
      />
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
        setNavigation((current) => ({ ...current, page: 1 }));
        return;
       }
       const nextCategory = NoteCategorySchema.safeParse(value);
       if (nextCategory.success) {
        setCategory(nextCategory.data);
        setNavigation((current) => ({ ...current, page: 1 }));
       }
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
     <Select
      value={sourceHost}
      onValueChange={(value) => {
       setSourceHost(value);
       setNavigation((current) => ({ ...current, page: 1 }));
      }}
     >
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
     page={page}
     onPageChange={(nextPage) => setNavigation((current) => ({ ...current, page: nextPage }))}
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
