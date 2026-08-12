"use client";

import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
 BookOpen,
 CheckCircle2,
 Clock,
 Ellipsis,
 FileText,
 FolderInput,
 Inbox,
 Loader2,
 NotebookPen,
 Pencil,
 Trash2,
 Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogClose,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/dropdown-menu";
import { IconTile } from "@/components/ui/icon-tile";
import { useUpdateNoteLibraryMetadata } from "@/features/notes/hooks/useNoteLibrary";
import { useDeleteNoteFromList } from "@/features/notes/hooks/useNotesList";
import { NoteLibraryMetadataDialog } from "@/features/notes/components/NoteLibraryMetadataDialog";
import { readingStatusLabels } from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteListItem } from "@/services/notes.service";
import { noteTabsStore } from "@/stores/note-tabs-store";
import { ReadingStatusSchema } from "@/types/database";
import { z } from "zod";
import type { LessonLookup } from "./noteContext";
import { getNoteContext } from "./noteContext";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

function getContextIcon(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return <BookOpen />;
 if (kind === "quick") return <Zap />;
 return <NotebookPen />;
}

function getContextTone(kind: ReturnType<typeof getNoteContext>["kind"]) {
 if (kind === "lesson") return "info";
 if (kind === "quick") return "warning";
 return "neutral";
}

function getFolderBreadcrumb(
 folderId: NoteListItem["folder_id"],
 folders: NoteFolder[],
): Nullable<string> {
 if (!folderId) return null;
 const folder = folders.find((item) => item.id === folderId);
 if (!folder) return null;
 const parent = folder.parentId ? folders.find((item) => item.id === folder.parentId) : null;
 return parent ? `${parent.name} / ${folder.name}` : folder.name;
}

export function NoteListRow({
 note,
 folders,
 lessonLookup,
}: {
 note: NoteListItem;
 folders: NoteFolder[];
 lessonLookup: LessonLookup;
}) {
 const context = getNoteContext(note, lessonLookup);
 const updatedAt = format(new Date(note.updated_at), "dd/MM/yy", { locale: vi });
 const folderBreadcrumb = getFolderBreadcrumb(note.folder_id, folders);
 const metadataMutation = useUpdateNoteLibraryMetadata();
 const deleteMutation = useDeleteNoteFromList();
 const { closeTab } = noteTabsStore.actions;
 const [metadataOpen, setMetadataOpen] = useState(false);
 const [deleteOpen, setDeleteOpen] = useState(false);
 const sortedFolders = useMemo(
  () => [...folders].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
  [folders],
 );

 const updateMetadata = async (input: {
  folderId?: NoteListItem["folder_id"];
  readingStatus?: NoteListItem["reading_status"];
 }) => {
  try {
   await metadataMutation.mutateAsync({ noteId: note.id, ...input });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể cập nhật ghi chú.");
  }
 };

 const handleDelete = async () => {
  try {
   await deleteMutation.mutateAsync(note.id);
   closeTab(note.id);
   setDeleteOpen(false);
   toast.success("Đã xóa ghi chú.");
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa ghi chú.");
  }
 };

 return (
  <>
   <article className="group grid grid-cols-[minmax(0,1fr)_auto] border-b border-border-default transition-colors last:border-b-0 hover:bg-bg-subtle/70">
    <Link href={`/notes/${note.id}`} className="min-w-0 px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
     <div className="flex min-w-0 items-start gap-3">
      <IconTile tone={getContextTone(context.kind)} size="sm" className="translate-y-0.5">
       {getContextIcon(context.kind)}
      </IconTile>

      <div className="grid min-w-0 gap-1.5">
       <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Typography tone="default" weight="bold" clamp="one">
         {context.displayTitle}
        </Typography>
        {note.reading_status ? (
         <Badge variant="purple" size="sm" casing="natural">
          {readingStatusLabels[note.reading_status]}
         </Badge>
        ) : (
         <Badge
          variant={context.kind === "lesson" ? "purple" : "default"}
          size="sm"
          casing="natural"
         >
          {context.title}
         </Badge>
        )}
       </div>

       <Typography
        as="div"
        variant="caption"
        tone="muted"
        weight="medium"
        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
       >
        {folderBreadcrumb ? <span>{folderBreadcrumb}</span> : null}
        {folderBreadcrumb && (note.source_label || context.subtitle) ? <span>/</span> : null}
        <Typography as="span" variant="caption" tone="muted" weight="medium" clamp="one">
         {note.source_label || context.subtitle}
        </Typography>
        {note.source_author ? <span>· {note.source_author}</span> : null}
       </Typography>

       <div className="flex flex-wrap items-center gap-1.5">
        {context.badges.slice(1, 4).map((tag) => (
         <Badge key={tag} size="sm" casing="natural">
          {tag}
         </Badge>
        ))}
        <Typography
         variant="caption"
         tone="muted"
         weight="semibold"
         className="flex items-center gap-1"
        >
         <Clock className="size-3.5" /> {updatedAt}
        </Typography>
       </div>
      </div>
     </div>
    </Link>

    <div className="flex items-start gap-1 px-2 py-3 lg:py-4">
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button variant="ghost" size="icon-toolbar" aria-label={`Tùy chọn ${note.title}`}>
        <Ellipsis />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" width="md">
       <DropdownMenuItem onSelect={() => setMetadataOpen(true)}>
        <Pencil /> Chỉnh thông tin
       </DropdownMenuItem>

       <DropdownMenuSeparator />
       <DropdownMenuSub>
        <DropdownMenuSubTrigger>
         <FolderInput /> Chuyển folder
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent sideOffset={4} width="md">
         <DropdownMenuItem onSelect={() => void updateMetadata({ folderId: null })}>
          <Inbox /> Chưa phân loại
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
       <DropdownMenuLabel>Trạng thái đọc</DropdownMenuLabel>
       {ReadingStatusSchema.options.map((status) => (
        <DropdownMenuItem
         key={status}
         onSelect={() => void updateMetadata({ readingStatus: status })}
        >
         {status === "completed" ? (
          <CheckCircle2 />
         ) : status === "reading" ? (
          <BookOpen />
         ) : (
          <Inbox />
         )}
         {readingStatusLabels[status]}
        </DropdownMenuItem>
       ))}
       {note.reading_status ? (
        <DropdownMenuItem onSelect={() => void updateMetadata({ readingStatus: null })}>
         <FileText /> Bỏ trạng thái đọc
        </DropdownMenuItem>
       ) : null}
       <DropdownMenuSeparator />
       <DropdownMenuItem tone="destructive" onSelect={() => setDeleteOpen(true)}>
        <Trash2 /> Xóa ghi chú
       </DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>
     {metadataOpen ? (
      <NoteLibraryMetadataDialog note={note} open onOpenChange={setMetadataOpen} hideTrigger />
     ) : null}
    </div>
   </article>

   <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
    <DialogContent className="max-w-md" showCloseButton={!deleteMutation.isPending}>
     <DialogHeader>
      <DialogTitle>Xóa ghi chú?</DialogTitle>
      <DialogDescription>
       “{context.displayTitle}” sẽ bị xóa khỏi danh sách ghi chú của bạn.
      </DialogDescription>
     </DialogHeader>
     <DialogFooter>
      <DialogClose asChild>
       <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
        Hủy
       </Button>
      </DialogClose>
      <Button
       type="button"
       variant="destructive"
       disabled={deleteMutation.isPending}
       onClick={() => void handleDelete()}
      >
       {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
       {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
