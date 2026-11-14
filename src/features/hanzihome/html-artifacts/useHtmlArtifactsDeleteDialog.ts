"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getHtmlArtifactApiErrorMessage as getApiErrorMessage } from "./html-artifact-display-utils";
import type { FolderFilter } from "./html-artifact-page-utils";
import type { HtmlArtifact, HtmlArtifactFolder, HtmlArtifactSummary } from "./html-artifact.schema";
import {
 useDeleteHtmlArtifactFolderMutation,
 useDeleteHtmlArtifactMutation,
} from "./useHtmlArtifacts";
import type { DeleteDialogState } from "./components/HtmlArtifactDialogs";
import type { Nullable } from "./components/HtmlArtifactEditor";

export function useHtmlArtifactsDeleteDialog({
 activeFolderId,
 filteredArtifacts,
 folders,
 selectedArtifact,
 onActiveFolderChange,
 onArtifactDeleted,
}: {
 activeFolderId: FolderFilter;
 filteredArtifacts: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
 selectedArtifact: Nullable<HtmlArtifact>;
 onActiveFolderChange: (folderId: FolderFilter) => void;
 onArtifactDeleted: (nextArtifactId: string) => void;
}) {
 const [deleteDialog, setDeleteDialog] = useState<Nullable<DeleteDialogState>>(null);
 const deleteMutation = useDeleteHtmlArtifactMutation();
 const deleteFolderMutation = useDeleteHtmlArtifactFolderMutation();

 const requestDeleteActiveFolder = () => {
  if (activeFolderId === "all" || activeFolderId === "unfiled") return;
  const folder = folders.find((item) => item.id === activeFolderId);
  if (folder) setDeleteDialog({ kind: "folder", folder });
 };
 const requestDeleteSelectedArtifact = () => {
  if (selectedArtifact) setDeleteDialog({ kind: "artifact", artifact: selectedArtifact });
 };
 const requestDeleteArtifactSummary = (artifact: HtmlArtifactSummary) =>
  setDeleteDialog({ kind: "artifact", artifact });

 const confirmDelete = async () => {
  if (!deleteDialog) return;
  try {
   if (deleteDialog.kind === "folder") {
    await deleteFolderMutation.mutateAsync(deleteDialog.folder.id);
    onActiveFolderChange("all");
    setDeleteDialog(null);
    toast.success("Đã xóa thư mục");
    return;
   }
   await deleteMutation.mutateAsync(deleteDialog.artifact.id);
   toast.success("Đã xóa tệp HTML");
   const nextArtifact =
    filteredArtifacts.find((artifact) => artifact.id !== deleteDialog.artifact.id) ?? null;
   onArtifactDeleted(nextArtifact?.id ?? "new");
   setDeleteDialog(null);
  } catch (error) {
   toast.error(
    getApiErrorMessage(
     error,
     deleteDialog.kind === "folder" ? "Không thể xóa thư mục" : "Không thể xóa tệp HTML",
    ),
   );
  }
 };

 return {
  confirmDelete,
  deleteDialog,
  deleteFolderMutation,
  deleteMutation,
  requestDeleteActiveFolder,
  requestDeleteArtifactSummary,
  requestDeleteSelectedArtifact,
  setDeleteDialog,
 };
}
