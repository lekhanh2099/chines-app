"use client";

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
import { Typography } from "@/components/ui/typography";
import { useNoteFolderMutations } from "@/features/notes/hooks/useNoteLibrary";
import {
 buildNoteFolderTree,
 matchesNoteLibraryView,
 type NoteFolderTreeNode,
 type NoteLibraryView,
} from "@/features/notes/note-library-utils";
import type { NoteFolder, NoteFolderColor, NoteListItem } from "@/services/notes.service";
import { NoteFolderColorSchema } from "@/services/notes.service";

type FolderDialogState =
 | { mode: "create"; parentId: string | null }
 | { mode: "rename"; folder: NoteFolder }
 | { mode: "delete"; folder: NoteFolder }
 | null;
type FolderMoveDirection = -1 | 1;

const smartViewDefinitions: Array<{
 value: Exclude<NoteLibraryView, `folder:${string}`>;
 icon: typeof Clock3;
}> = [
 { value: "recent", icon: Clock3 },
 { value: "inbox", icon: Bookmark },
 { value: "reading", icon: BookOpen },
 { value: "completed", icon: CheckCircle2 },
 { value: "lesson", icon: NotebookPen },
 { value: "quick", icon: Zap },
 { value: "unfiled", icon: Inbox },
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
 const t = useTranslations("Notes");
 const common = useTranslations("Common");
 const [dialogState, setDialogState] = useState<FolderDialogState>(null);
 const [folderName, setFolderName] = useState("");
 const [folderColor, setFolderColor] = useState<NoteFolderColor>("purple");
 const folderTree = useMemo(() => buildNoteFolderTree(folders), [folders]);
 const { createMutation, updateMutation, deleteMutation } = useNoteFolderMutations();

 const openDialog = (state: Exclude<FolderDialogState, null>) => {
  setFolderName(state.mode === "rename" ? state.folder.name : "");
  setFolderColor(state.mode === "rename" ? state.folder.color : "purple");
  setDialogState(state);
 };

 const chooseView = (view: NoteLibraryView) => {
  onViewChange(view);
  onNavigate?.();
 };

 const saveFolder = async () => {
  if (!dialogState || dialogState.mode === "delete" || !folderName.trim()) return;

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
  } catch {
   toast.error(t("folders.saveError"));
  }
 };

 const deleteFolder = async () => {
  if (dialogState?.mode !== "delete") return;
  try {
   await deleteMutation.mutateAsync(dialogState.folder.id);
   if (activeView === `folder:${dialogState.folder.id}`) onViewChange("unfiled");
   setDialogState(null);
  } catch {
   toast.error(t("folders.deleteError"));
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
  } catch {
   toast.error(t("folders.sortError"));
  }
 };

 return (
  <>
   <nav aria-label={t("library")} className="grid content-start gap-5">
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
      {t("views.library")}
     </Typography>
     {smartViewDefinitions.map((view) => {
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
        {t(`views.${view.value}`)}
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
       {t("folders.title")}
      </Typography>
      <Button
       variant="ghost"
       size="icon-toolbar"
       aria-label={t("folders.create")}
       onClick={() => openDialog({ mode: "create", parentId: null })}
      >
       <FolderPlus />
      </Button>
     </div>

     {folderTree.length === 0 ? (
      <Typography as="p" variant="bodySmall" tone="muted" weight="medium" className="px-2 py-2">
       {t("folders.empty")}
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
        ? t("folders.deleteTitle")
        : dialogState?.mode === "rename"
          ? t("folders.renameTitle")
          : t("folders.createTitle")}
      </DialogTitle>
      <DialogDescription>
       {dialogState?.mode === "delete"
        ? t("folders.deleteDescription")
        : t("folders.description")}
      </DialogDescription>
     </DialogHeader>
     {dialogState?.mode === "delete" ? null : (
      <DialogBody>
       <Field>
        <FieldLabel htmlFor="note-folder-name">{t("folders.name")}</FieldLabel>
        <Input
         id="note-folder-name"
         value={folderName}
         onChange={(event) => setFolderName(event.target.value)}
         maxLength={80}
         autoFocus
        />
       </Field>
       <Field>
        <FieldLabel>{t("folders.color")}</FieldLabel>
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
          <SelectItem value="purple">{t("folders.colors.purple")}</SelectItem>
          <SelectItem value="blue">{t("folders.colors.blue")}</SelectItem>
          <SelectItem value="green">{t("folders.colors.green")}</SelectItem>
          <SelectItem value="orange">{t("folders.colors.orange")}</SelectItem>
          <SelectItem value="rose">{t("folders.colors.rose")}</SelectItem>
          <SelectItem value="slate">{t("folders.colors.slate")}</SelectItem>
         </SelectContent>
        </Select>
       </Field>
      </DialogBody>
     )}
     <DialogFooter>
      <Button variant="outline" onClick={() => setDialogState(null)}>
       {common("actions.cancel")}
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
       {dialogState?.mode === "delete" ? t("folders.delete") : common("actions.save")}
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
 const t = useTranslations("Notes.folders");
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
      <Button variant="ghost" size="icon-toolbar" aria-label={t("options", { name: folder.name })}>
       <Ellipsis />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end">
      {folder.parentId === null ? (
       <DropdownMenuItem onSelect={() => onCreateChild(folder.id)}>
        <FolderPlus /> {t("addChild")}
       </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onSelect={() => onRename(folder)}>
       <Pencil /> {t("rename")}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onMove(folder, -1)}>
       <ChevronUp /> {t("moveUp")}
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => onMove(folder, 1)}>
       <ChevronDown /> {t("moveDown")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem tone="destructive" onSelect={() => onDelete(folder)}>
       <Trash2 /> {t("delete")}
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
