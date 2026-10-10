"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Typography } from "@/components/ui/display/typography";
import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/forms/field";
import { Input } from "@/components/ui/forms/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import {
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "@/features/notes/hooks/useNoteLibrary";
import { createNoteLibraryMetadataInput } from "@/features/notes/note-library-utils";
import {
 NoteConflictError,
 type getNoteById,
 type NoteDetail,
} from "@/services/notes/notes.service";

type NoteLibraryMetadataTarget = {
 id: NoteDetail["id"];
 revision: NoteDetail["revision"];
 title: NoteDetail["title"];
 folder_id: NoteDetail["folder_id"];
 reading_status: NoteDetail["reading_status"];
 source_url: NoteDetail["source_url"];
 source_label: NoteDetail["source_label"];
 source_author: NoteDetail["source_author"];
 source_published_at: NoteDetail["source_published_at"];
 source_captured_at: NoteDetail["source_captured_at"];
};

export function NoteLibraryMetadataDialog({
 note,
 compact = false,
 open: controlledOpen,
 onOpenChange: controlledOnOpenChange,
 hideTrigger = false,
 initialConflict,
}: {
 note: NoteLibraryMetadataTarget;
 compact?: boolean;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
 hideTrigger?: boolean;
 initialConflict?: NoteDetail;
}) {
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const [internalOpen, setInternalOpen] = useState(false);
 const open = controlledOpen ?? internalOpen;
 const setOpen = controlledOnOpenChange ?? setInternalOpen;
 const [expectedRevision, setExpectedRevision] = useState(note.revision);
 const [conflict, setConflict] = useState<Awaited<ReturnType<typeof getNoteById>>>(
  initialConflict ?? null,
 );
 const [title, setTitle] = useState(note.title);
 const [folderId, setFolderId] = useState(note.folder_id ?? "unfiled");
 const [readingStatus, setReadingStatus] = useState(note.reading_status ?? "none");
 const [sourceUrl, setSourceUrl] = useState(note.source_url ?? "");
 const [sourceLabel, setSourceLabel] = useState(note.source_label ?? "");
 const [sourceAuthor, setSourceAuthor] = useState(note.source_author ?? "");
 const [publishedAt, setPublishedAt] = useState(note.source_published_at ?? "");
 const [sourceCapturedAt, setSourceCapturedAt] = useState(note.source_captured_at);
 const foldersQuery = useNoteFolders();
 const mutation = useUpdateNoteLibraryMetadata(note.id);

 const resetFields = (target: NoteLibraryMetadataTarget) => {
  setExpectedRevision(target.revision);
  setConflict(null);
  setTitle(target.title);
  setFolderId(target.folder_id ?? "unfiled");
  setReadingStatus(target.reading_status ?? "none");
  setSourceUrl(target.source_url ?? "");
  setSourceLabel(target.source_label ?? "");
  setSourceAuthor(target.source_author ?? "");
  setPublishedAt(target.source_published_at ?? "");
  setSourceCapturedAt(target.source_captured_at);
 };

 const save = async (revision = expectedRevision) => {
  const nextTitle = title.trim();
  if (!nextTitle) {
   toast.error(t("metadata.titleRequired"));
   return;
  }

  try {
   await mutation.mutateAsync({
    noteId: note.id,
    expectedRevision: revision,
    ...createNoteLibraryMetadataInput(
     {
      title: nextTitle,
      folderId,
      readingStatus,
      sourceUrl,
      sourceLabel,
      sourceAuthor,
      publishedAt,
      sourceCapturedAt,
     },
     new Date().toISOString(),
    ),
   });
   setConflict(null);
   setOpen(false);
   toast.success(t("metadata.success"));
  } catch (error) {
   if (error instanceof NoteConflictError) setConflict(error.serverNote);
   else toast.error(t("metadata.error"));
  }
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   {!hideTrigger ? (
    <DialogTrigger asChild>
     <Button
      variant={compact ? "menu" : "outline"}
      size={compact ? "menu" : "icon-sm"}
      aria-label={t("metadata.trigger")}
      title={t("metadata.trigger")}
      onClick={() => resetFields(note)}
     >
      <Settings2 />
      {compact ? t("metadata.trigger") : null}
     </Button>
    </DialogTrigger>
   ) : null}
   <DialogContent size="md">
    <DialogHeader>
     <DialogTitle icon={<Settings2 />}>{t("metadata.title")}</DialogTitle>
     <DialogDescription>{t("metadata.description")}</DialogDescription>
    </DialogHeader>
    <DialogBody>
     {conflict ? (
      <div role="alert" className="grid gap-2">
       <Typography variant="bodySmall">{t("editor.conflict.description")}</Typography>
       <Typography variant="bodySmall">
        {t("editor.conflict.serverTitle", { title: conflict.title, revision: conflict.revision })}
       </Typography>
       <div className="flex flex-wrap gap-2">
        <Button
         variant="outline"
         disabled={mutation.isPending}
         onClick={() => resetFields(conflict)}
        >
         {t("editor.conflict.useServer")}
        </Button>
        <Button
         disabled={mutation.isPending}
         onClick={() => {
          void save(conflict.revision);
         }}
        >
         {t("editor.conflict.keepLocal")}
        </Button>
       </div>
      </div>
     ) : null}
     <FieldGroup>
      <Field>
       <FieldLabel htmlFor="note-title">{t("metadata.titleLabel")}</FieldLabel>
       <Input
        id="note-title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={t("metadata.titlePlaceholder")}
       />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
       <Field>
        <FieldLabel>{t("metadata.folder")}</FieldLabel>
        <Select value={folderId} onValueChange={setFolderId}>
         <SelectTrigger width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="unfiled">{t("views.unfiled")}</SelectItem>
          {(foldersQuery.data ?? []).map((folder) => (
           <SelectItem key={folder.id} value={folder.id}>
            {folder.parentId ? `↳ ${folder.name}` : folder.name}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </Field>
       <Field>
        <FieldLabel>{t("metadata.readingStatus")}</FieldLabel>
        <Select value={readingStatus} onValueChange={setReadingStatus}>
         <SelectTrigger width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="none">{t("readingStatus.none")}</SelectItem>
          <SelectItem value="inbox">{t("readingStatus.inbox")}</SelectItem>
          <SelectItem value="reading">{t("readingStatus.reading")}</SelectItem>
          <SelectItem value="completed">{t("readingStatus.completed")}</SelectItem>
         </SelectContent>
        </Select>
       </Field>
      </div>

      <Field>
       <FieldLabel htmlFor="note-source-url">{t("metadata.sourceUrl")}</FieldLabel>
       <Input
        id="note-source-url"
        type="url"
        value={sourceUrl}
        onChange={(event) => setSourceUrl(event.target.value)}
        placeholder="https://..."
       />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
       <Field>
        <FieldLabel htmlFor="note-source-label">{t("metadata.sourceLabel")}</FieldLabel>
        <Input
         id="note-source-label"
         value={sourceLabel}
         onChange={(event) => setSourceLabel(event.target.value)}
        />
       </Field>
       <Field>
        <FieldLabel htmlFor="note-source-author">{t("metadata.sourceAuthor")}</FieldLabel>
        <Input
         id="note-source-author"
         value={sourceAuthor}
         onChange={(event) => setSourceAuthor(event.target.value)}
        />
       </Field>
      </div>
      <Field>
       <FieldLabel htmlFor="note-source-date">{t("metadata.publishedAt")}</FieldLabel>
       <Input
        id="note-source-date"
        type="date"
        value={publishedAt}
        onChange={(event) => setPublishedAt(event.target.value)}
       />
      </Field>
     </FieldGroup>
    </DialogBody>
    <DialogFooter>
     <Button variant="outline" onClick={() => setOpen(false)}>
      {common("actions.cancel")}
     </Button>
     <Button
      disabled={mutation.isPending || Boolean(conflict) || !title.trim()}
      onClick={() => void save()}
     >
      {common("actions.save")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
