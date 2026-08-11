"use client";

import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import {
 BookOpen,
 Bookmark,
 CheckCircle2,
 ChevronDown,
 ChevronUp,
 Clock3,
 Ellipsis,
 Folder,
 FolderPlus,
 Inbox,
 NotebookPen,
 Pencil,
 Trash2,
 Zap,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useNoteFolderMutations } from "@/features/notes/hooks/useNoteLibrary";
import {
 buildNoteFolderTree,
 matchesNoteLibraryView,
 type NoteFolderTreeNode,
 type NoteLibraryView,
} from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteFolderColor, NoteListItem } from "@/services/notes.service";
import { NoteFolderColorSchema, NoteFolderSchema } from "@/services/notes.service";
import { z } from "zod";

const FolderDialogStateSchema = z
 .discriminatedUnion("mode", [
  z.object({ mode: z.literal("create"), parentId: z.string().nullable() }),
  z.object({ mode: z.literal("rename"), folder: NoteFolderSchema }),
  z.object({ mode: z.literal("delete"), folder: NoteFolderSchema }),
 ])
 .nullable();
type FolderDialogState = z.infer<typeof FolderDialogStateSchema>;
const FolderMoveDirectionSchema = z.union([z.literal(-1), z.literal(1)]);
type FolderMoveDirection = z.infer<typeof FolderMoveDirectionSchema>;

const smartViews: Array<{
 value: NoteLibraryView;
 label: string;
 icon: typeof Clock3;
}> = [
 { value: "recent", label: "Gần đây", icon: Clock3 },
 { value: "inbox", label: "Đọc sau", icon: Bookmark },
 { value: "reading", label: "Đang đọc", icon: BookOpen },
 { value: "completed", label: "Đã đọc", icon: CheckCircle2 },
 { value: "lesson", label: "Theo bài học", icon: NotebookPen },
 { value: "quick", label: "Ghi chú nhanh", icon: Zap },
 { value: "unfiled", label: "Chưa phân loại", icon: Inbox },
];

export function NotesLibraryNavigator({
 notes,
 folders,
 activeView,
 onViewChange,
 onNavigate,
}: {
 notes: NoteListItem[];
 folders: NoteFolder[];
 activeView: NoteLibraryView;
 onViewChange: (view: NoteLibraryView) => void;
 onNavigate?: () => void;
}) {
 const [dialogState, setDialogState] = useState<FolderDialogState>(null);
 const [folderName, setFolderName] = useState("");
 const [folderColor, setFolderColor] = useState<NoteFolderColor>("purple");
 const folderTree = useMemo(() => buildNoteFolderTree(folders), [folders]);
 const { createMutation, updateMutation, deleteMutation } = useNoteFolderMutations();

 const openDialog = (state: NonNullable<FolderDialogState>) => {
  setFolderName(state.mode === "rename" ? state.folder.name : "");
  setFolderColor(state.mode === "rename" ? state.folder.color : "purple");
  setDialogState(state);
 };

 const chooseView = (view: NoteLibraryView) => {
  onViewChange(view);
  onNavigate?.();
 };

 const saveFolder = async () => {
  if (!dialogState || dialogState.mode === "delete") return;
  if (!folderName.trim()) return;

  try {
   if (dialogState.mode === "create") {
    await createMutation.mutateAsync({
     name: folderName,
     color: folderColor,
     parentId: dialogState.parentId,
     position: folders.filter((folder) => folder.parentId === dialogState.parentId).length,
    });
   } else {
    await updateMutation.mutateAsync({
     folderId: dialogState.folder.id,
     changes: { name: folderName, color: folderColor },
    });
   }
   setDialogState(null);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể lưu folder.");
  }
 };

 const deleteFolder = async () => {
  if (dialogState?.mode !== "delete") return;
  try {
   await deleteMutation.mutateAsync(dialogState.folder.id);
   if (activeView === `folder:${dialogState.folder.id}`) onViewChange("unfiled");
   setDialogState(null);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể xóa folder.");
  }
 };

 const moveFolder = async (folder: NoteFolder, direction: FolderMoveDirection) => {
  const siblings = folders
   .filter((item) => item.parentId === folder.parentId)
   .sort((a, b) => a.position - b.position);
  const index = siblings.findIndex((item) => item.id === folder.id);
  const swap = siblings[index + direction];
  if (!swap) return;

  try {
   await Promise.all([
    updateMutation.mutateAsync({ folderId: folder.id, changes: { position: swap.position } }),
    updateMutation.mutateAsync({ folderId: swap.id, changes: { position: folder.position } }),
   ]);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể sắp xếp folder.");
  }
 };

 return (
  <>
   <nav aria-label="Thư viện ghi chú" className="grid content-start gap-5">
    <section className="grid gap-1">
     <Typography
      as="h2"
      variant="sectionTitle"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
      className="px-2"
     >
      Thư viện
     </Typography>
     {smartViews.map((view) => {
      const Icon = view.icon;
      const count = notes.filter((note) => matchesNoteLibraryView(note, view.value)).length;
      return (
       <Button
        key={view.value}
        variant={activeView === view.value ? "menuActive" : "menu"}
        size="menu"
        aria-pressed={activeView === view.value}
        onClick={() => chooseView(view.value)}
       >
        <Icon />
        {view.label}
        <Typography variant="caption" tone="muted" className="ml-auto">
         {count}
        </Typography>
       </Button>
      );
     })}
    </section>

    <section className="grid gap-1">
     <div className="flex items-center justify-between gap-2 px-2">
      <Typography
       as="h2"
       variant="sectionTitle"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Folder
      </Typography>
      <Button
       variant="ghost"
       size="icon-toolbar"
       aria-label="Tạo folder"
       onClick={() =>
        openDialog({
         mode: FolderDialogStateSchema.unwrap().options[0].shape.mode.value,
         parentId: null,
        })
       }
      >
       <FolderPlus />
      </Button>
     </div>

     {folderTree.length === 0 ? (
      <Typography as="p" variant="bodySmall" tone="muted" weight="medium" className="px-2 py-2">
       Chưa có folder.
      </Typography>
     ) : (
      folderTree.map((folder) => (
       <FolderNavigationRow
        key={folder.id}
        folder={folder}
        activeView={activeView}
        notes={notes}
        onChoose={chooseView}
        onCreateChild={(parentId) => openDialog({ mode: "create", parentId })}
        onRename={(item) => openDialog({ mode: "rename", folder: item })}
        onDelete={(item) => openDialog({ mode: "delete", folder: item })}
        onMove={moveFolder}
       />
      ))
     )}
    </section>
   </nav>

   <Dialog open={dialogState !== null} onOpenChange={(open) => !open && setDialogState(null)}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>
       {dialogState?.mode === "delete"
        ? "Xóa folder"
        : dialogState?.mode === "rename"
          ? "Đổi tên folder"
          : "Tạo folder"}
      </DialogTitle>
      <DialogDescription>
       {dialogState?.mode === "delete"
        ? "Ghi chú sẽ về Chưa phân loại; folder con sẽ được đưa lên cấp gốc."
        : "Folder hỗ trợ tối đa hai tầng."}
      </DialogDescription>
     </DialogHeader>
     {dialogState?.mode === "delete" ? null : (
      <DialogBody>
       <Field>
        <FieldLabel htmlFor="note-folder-name">Tên folder</FieldLabel>
        <Input
         id="note-folder-name"
         value={folderName}
         onChange={(event) => setFolderName(event.target.value)}
         maxLength={80}
         autoFocus
        />
       </Field>
       <Field>
        <FieldLabel>Màu</FieldLabel>
        <Select
         value={folderColor}
         onValueChange={(value) => {
          const color = NoteFolderColorSchema.safeParse(value);
          if (color.success) setFolderColor(color.data);
         }}
        >
         <SelectTrigger width="full">
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="purple">Tím</SelectItem>
          <SelectItem value="blue">Xanh dương</SelectItem>
          <SelectItem value="green">Xanh lá</SelectItem>
          <SelectItem value="orange">Cam</SelectItem>
          <SelectItem value="rose">Hồng</SelectItem>
          <SelectItem value="slate">Xám</SelectItem>
         </SelectContent>
        </Select>
       </Field>
      </DialogBody>
     )}
     <DialogFooter>
      <Button variant="outline" onClick={() => setDialogState(null)}>
       Hủy
      </Button>
      <Button
       variant={dialogState?.mode === "delete" ? "destructive" : "default"}
       disabled={
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        (dialogState?.mode !== "delete" && !folderName.trim())
       }
       onClick={dialogState?.mode === "delete" ? deleteFolder : saveFolder}
      >
       {dialogState?.mode === "delete" ? "Xóa" : "Lưu"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}

function FolderNavigationRow({
 folder,
 activeView,
 notes,
 onChoose,
 onCreateChild,
 onRename,
 onDelete,
 onMove,
}: {
 folder: NoteFolderTreeNode;
 activeView: NoteLibraryView;
 notes: NoteListItem[];
 onChoose: (view: NoteLibraryView) => void;
 onCreateChild: (parentId: string) => void;
 onRename: (folder: NoteFolder) => void;
 onDelete: (folder: NoteFolder) => void;
 onMove: (folder: NoteFolder, direction: FolderMoveDirection) => void;
}) {
 const view: NoteLibraryView = `folder:${folder.id}`;
 const count = notes.filter((note) => note.folder_id === folder.id).length;

 return (
  <div className="grid gap-1">
   <div className="flex min-w-0 items-center gap-1">
    <Button
     variant={activeView === view ? "menuActive" : "menu"}
     size="menu"
     aria-pressed={activeView === view}
     className="min-w-0 flex-1"
     onClick={() => onChoose(view)}
    >
     <Folder />
     <Typography as="span" clamp="one">
      {folder.name}
     </Typography>
     <Typography variant="caption" tone="muted" className="ml-auto">
      {count}
     </Typography>
    </Button>
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-toolbar" aria-label={`Tùy chọn folder ${folder.name}`}>
       <Ellipsis />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end">
      {folder.parentId === null ? (
       <DropdownMenuItem onSelect={() => onCreateChild(folder.id)}>
        <FolderPlus /> Thêm folder con
       </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onSelect={() => onRename(folder)}>
       <Pencil /> Đổi tên
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onMove(folder, FolderMoveDirectionSchema.options[0].value)}>
       <ChevronUp /> Đưa lên
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onMove(folder, 1)}>
       <ChevronDown /> Đưa xuống
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="destructive" onSelect={() => onDelete(folder)}>
       <Trash2 /> Xóa folder
      </DropdownMenuItem>
     </DropdownMenuContent>
    </DropdownMenu>
   </div>
   {folder.children.length > 0 ? (
    <div className="relative grid gap-1 pl-7 before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-border-default">
     {folder.children.map((child) => (
      <FolderNavigationRow
       key={child.id}
       folder={child}
       activeView={activeView}
       notes={notes}
       onChoose={onChoose}
       onCreateChild={onCreateChild}
       onRename={onRename}
       onDelete={onDelete}
       onMove={onMove}
      />
     ))}
    </div>
   ) : null}
  </div>
 );
}
