"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 useNoteFolders,
 useUpdateNoteLibraryMetadata,
} from "@/features/notes/hooks/useNoteLibrary";
import { normalizeReadingUrl } from "@/features/notes/note-library-utils";
import type { NoteDetail } from "@/services/notes.service";
import { ReadingStatusSchema } from "@/types/database";

type NoteLibraryMetadataTarget = {
 id: NoteDetail["id"];
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
}: {
 note: NoteLibraryMetadataTarget;
 compact?: boolean;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
 hideTrigger?: boolean;
}) {
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const [internalOpen, setInternalOpen] = useState(false);
 const open = controlledOpen ?? internalOpen;
 const setOpen = controlledOnOpenChange ?? setInternalOpen;
 const [title, setTitle] = useState(note.title);
 const [folderId, setFolderId] = useState(note.folder_id ?? "unfiled");
 const [readingStatus, setReadingStatus] = useState(note.reading_status ?? "none");
 const [sourceUrl, setSourceUrl] = useState(note.source_url ?? "");
 const [sourceLabel, setSourceLabel] = useState(note.source_label ?? "");
 const [sourceAuthor, setSourceAuthor] = useState(note.source_author ?? "");
 const [publishedAt, setPublishedAt] = useState(note.source_published_at ?? "");
 const foldersQuery = useNoteFolders();
 const mutation = useUpdateNoteLibraryMetadata();

 const resetFields = () => {
  setTitle(note.title);
  setFolderId(note.folder_id ?? "unfiled");
  setReadingStatus(note.reading_status ?? "none");
  setSourceUrl(note.source_url ?? "");
  setSourceLabel(note.source_label ?? "");
  setSourceAuthor(note.source_author ?? "");
  setPublishedAt(note.source_published_at ?? "");
 };

 const save = async () => {
  const nextTitle = title.trim();
  if (!nextTitle) {
   toast.error(t("metadata.titleRequired"));
   return;
  }

  try {
   const normalized = sourceUrl.trim() ? normalizeReadingUrl(sourceUrl) : null;
   const parsedReadingStatus = ReadingStatusSchema.safeParse(readingStatus);
   await mutation.mutateAsync({
    noteId: note.id,
    title: nextTitle,
    folderId: folderId === "unfiled" ? null : folderId,
    readingStatus: parsedReadingStatus.success ? parsedReadingStatus.data : null,
    source:
     normalized === null
      ? null
      : {
         url: normalized.url,
         host: normalized.host,
         label: sourceLabel.trim() || normalized.host,
         author: sourceAuthor.trim() || null,
         publishedAt: publishedAt || null,
         capturedAt: note.source_captured_at ?? new Date().toISOString(),
        },
   });
   setOpen(false);
   toast.success(t("metadata.success"));
  } catch {
   toast.error(t("metadata.error"));
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
      onClick={resetFields}
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
     <Button disabled={mutation.isPending || !title.trim()} onClick={() => void save()}>
      {common("actions.save")}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
