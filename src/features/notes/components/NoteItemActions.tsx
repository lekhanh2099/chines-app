"use client";

import { useMemo, useState } from "react";
import {
 BookOpen,
 CheckCircle2,
 Ellipsis,
 FileText,
 FolderInput,
 Inbox,
 Loader2,
 Pencil,
 Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { useUpdateNoteLibraryMetadata } from "@/features/notes/hooks/useNoteLibrary";
import { useDeleteNoteFromList } from "@/features/notes/hooks/useNotesList";
import { NoteConflictError, type getNoteById } from "@/services/notes/notes.service";
import type { NoteFolder, NoteListItem } from "@/services/notes/notes.service";
import { noteTabsStore } from "@/stores/notes/note-tabs-store";
import { ReadingStatusSchema, type ReadingStatus } from "@/types/database";

/** The "…" menu of a library note: rename/metadata, folder, reading status and delete. */
export function NoteItemActions({
 note,
 folders,
 displayTitle,
 onDeleted,
}: {
 note: NoteListItem;
 folders: NoteFolder[];
 displayTitle: string;
 /** Runs after the note is deleted, e.g. to drop this device's PDF copy. */
 onDeleted: () => void;
}) {
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const locale = useLocale();
 const metadataMutation = useUpdateNoteLibraryMetadata(note.id);
 const deleteMutation = useDeleteNoteFromList();
 const { closeTab } = noteTabsStore.actions;
 const [metadataOpen, setMetadataOpen] = useState(false);
 const [metadataDraft, setMetadataDraft] = useState<{
  folder_id?: NoteListItem["folder_id"];
  reading_status?: NoteListItem["reading_status"];
 }>({});
 const [metadataConflict, setMetadataConflict] =
  useState<Awaited<ReturnType<typeof getNoteById>>>(null);
 const [deleteOpen, setDeleteOpen] = useState(false);
 const sortedFolders = useMemo(
  () =>
   [...folders].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, locale)),
  [folders, locale],
 );

 const readingStatusLabel = (status: ReadingStatus) => t(`readingStatus.${status}`);

 const updateMetadata = async (input: {
  folderId?: NoteListItem["folder_id"];
  readingStatus?: NoteListItem["reading_status"];
 }) => {
  try {
   await metadataMutation.mutateAsync({
    noteId: note.id,
    expectedRevision: note.revision,
    ...input,
   });
  } catch (error) {
   if (error instanceof NoteConflictError) {
    const draft: typeof metadataDraft = {};
    if (input.folderId !== undefined) draft.folder_id = input.folderId;
    if (input.readingStatus !== undefined) draft.reading_status = input.readingStatus;
    setMetadataDraft(draft);
    setMetadataConflict(error.serverNote);
    setMetadataOpen(true);
   } else toast.error(t("row.updatedError"));
  }
 };

 const handleDelete = async () => {
  try {
   await deleteMutation.mutateAsync(note.id);
   closeTab(note.id);
   onDeleted();
   setDeleteOpen(false);
   toast.success(t("row.deleted"));
  } catch {
   toast.error(t("row.deleteError"));
  }
 };

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      variant="ghost"
      size="icon-toolbar"
      aria-label={t("row.options", { title: note.title })}
     >
      <Ellipsis />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <DropdownMenuItem onSelect={() => setMetadataOpen(true)}>
      <Pencil /> {t("row.editMetadata")}
     </DropdownMenuItem>

     <DropdownMenuSeparator />
     <DropdownMenuSub>
      <DropdownMenuSubTrigger>
       <FolderInput /> {t("row.moveFolder")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent sideOffset={4} width="md">
       <DropdownMenuItem onSelect={() => void updateMetadata({ folderId: null })}>
        <Inbox /> {t("views.unfiled")}
       </DropdownMenuItem>
       {sortedFolders.map((folder) => (
        <DropdownMenuItem
         key={folder.id}
         onSelect={() => void updateMetadata({ folderId: folder.id })}
        >
         <FolderInput /> {folder.parentId ? `↳ ${folder.name}` : folder.name}
        </DropdownMenuItem>
       ))}
      </DropdownMenuSubContent>
     </DropdownMenuSub>

     <DropdownMenuSeparator />
     <DropdownMenuLabel>{t("row.readingStatus")}</DropdownMenuLabel>
     {ReadingStatusSchema.options.map((status) => (
      <DropdownMenuItem
       key={status}
       onSelect={() => void updateMetadata({ readingStatus: status })}
      >
       {status === "completed" ? <CheckCircle2 /> : status === "reading" ? <BookOpen /> : <Inbox />}
       {readingStatusLabel(status)}
      </DropdownMenuItem>
     ))}
     {note.reading_status ? (
      <DropdownMenuItem onSelect={() => void updateMetadata({ readingStatus: null })}>
       <FileText /> {t("row.clearReadingStatus")}
      </DropdownMenuItem>
     ) : null}
     <DropdownMenuSeparator />
     <DropdownMenuItem tone="destructive" onSelect={() => setDeleteOpen(true)}>
      <Trash2 /> {t("row.delete")}
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>

   {metadataOpen ? (
    <NoteLibraryMetadataDialog
     note={{ ...note, ...metadataDraft }}
     initialConflict={metadataConflict ?? undefined}
     open
     onOpenChange={(open) => {
      setMetadataOpen(open);
      if (!open) {
       setMetadataDraft({});
       setMetadataConflict(null);
      }
     }}
     hideTrigger
    />
   ) : null}

   <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
    <DialogContent className="max-w-md" showCloseButton={!deleteMutation.isPending}>
     <DialogHeader>
      <DialogTitle>{t("row.deleteTitle")}</DialogTitle>
      <DialogDescription>{t("row.deleteDescription", { title: displayTitle })}</DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <DialogClose asChild>
       <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
        {common("actions.cancel")}
       </Button>
      </DialogClose>
      <Button
       type="button"
       variant="destructive"
       disabled={deleteMutation.isPending}
       onClick={() => void handleDelete()}
      >
       {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
       {deleteMutation.isPending ? t("row.deleting") : t("row.delete")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
