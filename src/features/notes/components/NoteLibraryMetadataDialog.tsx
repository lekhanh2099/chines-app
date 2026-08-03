"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
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
   toast.error("Nhập tiêu đề ghi chú.");
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
   toast.success("Đã cập nhật thông tin thư viện.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể cập nhật thông tin.");
  }
 };

 return (
  <Dialog open={open} onOpenChange={setOpen}>
   {!hideTrigger ? (
    <DialogTrigger asChild>
     <Button
      variant={compact ? "menu" : "outline"}
      size={compact ? "menu" : "icon-sm"}
      aria-label="Thông tin và đổi tên ghi chú"
      title="Thông tin và đổi tên ghi chú"
      onClick={resetFields}
     >
      <Settings2 />
      {compact ? "Thông tin và đổi tên" : null}
     </Button>
    </DialogTrigger>
   ) : null}
   <DialogContent size="md">
    <DialogHeader>
     <DialogTitle icon={<Settings2 />}>Thông tin ghi chú</DialogTitle>
     <DialogDescription>
      Đổi tiêu đề, folder, trạng thái đọc và nguồn mà không sửa nội dung note.
     </DialogDescription>
    </DialogHeader>
    <DialogBody>
     <FieldGroup>
      <Field>
       <FieldLabel htmlFor="note-title">Tiêu đề</FieldLabel>
       <Input
        id="note-title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Tiêu đề ghi chú"
       />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
       <Field>
        <FieldLabel>Folder</FieldLabel>
        <Select value={folderId} onValueChange={setFolderId}>
         <SelectTrigger width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="unfiled">Chưa phân loại</SelectItem>
          {(foldersQuery.data ?? []).map((folder) => (
           <SelectItem key={folder.id} value={folder.id}>
            {folder.parentId ? `↳ ${folder.name}` : folder.name}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
       </Field>
       <Field>
        <FieldLabel>Trạng thái đọc</FieldLabel>
        <Select value={readingStatus} onValueChange={setReadingStatus}>
         <SelectTrigger width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="none">Không áp dụng</SelectItem>
          <SelectItem value="inbox">Đọc sau</SelectItem>
          <SelectItem value="reading">Đang đọc</SelectItem>
          <SelectItem value="completed">Đã đọc</SelectItem>
         </SelectContent>
        </Select>
       </Field>
      </div>

      <Field>
       <FieldLabel htmlFor="note-source-url">URL nguồn</FieldLabel>
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
        <FieldLabel htmlFor="note-source-label">Tên nguồn</FieldLabel>
        <Input
         id="note-source-label"
         value={sourceLabel}
         onChange={(event) => setSourceLabel(event.target.value)}
        />
       </Field>
       <Field>
        <FieldLabel htmlFor="note-source-author">Tác giả</FieldLabel>
        <Input
         id="note-source-author"
         value={sourceAuthor}
         onChange={(event) => setSourceAuthor(event.target.value)}
        />
       </Field>
      </div>
      <Field>
       <FieldLabel htmlFor="note-source-date">Ngày xuất bản</FieldLabel>
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
      Hủy
     </Button>
     <Button disabled={mutation.isPending || !title.trim()} onClick={() => void save()}>
      Lưu
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}
