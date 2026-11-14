"use client";

import type { ComponentProps, FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { getHtmlArtifactApiErrorMessage as getApiErrorMessage } from "./html-artifact-display-utils";
import { hasFolderDescendant, type FolderFilter } from "./html-artifact-page-utils";
import type { HtmlArtifactFolder, HtmlArtifactSummary } from "./html-artifact.schema";
import {
 getConcreteFolderId,
 reorderHtmlArtifactFolderSiblings,
} from "./html-artifacts-page-model";
import {
 useCreateHtmlArtifactFolderMutation,
 useUpdateHtmlArtifactFolderMutation,
 type useUpdateHtmlArtifactMutation,
} from "./useHtmlArtifacts";
import { CreateFolderDialog, folderColorSequence } from "./components/HtmlArtifactDialogs";
import type { DragItem, MoveDirection } from "./components/HtmlArtifactDirectory";
import type { Nullable } from "./components/HtmlArtifactEditor";

type FolderDraft = ComponentProps<typeof CreateFolderDialog>["folderDraft"];

export function useHtmlArtifactsFolderActions({
 activeFolderId,
 artifacts,
 folders,
 updateMutation,
 onActiveFolderChange,
}: {
 activeFolderId: FolderFilter;
 artifacts: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
 updateMutation: ReturnType<typeof useUpdateHtmlArtifactMutation>;
 onActiveFolderChange: (folderId: FolderFilter) => void;
}) {
 const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
 const [folderDraft, setFolderDraft] = useState<FolderDraft>({
  name: "",
  parentFolderId: null,
  color: "blue",
 });
 const [dragItem, setDragItem] = useState<Nullable<DragItem>>(null);
 const createFolderMutation = useCreateHtmlArtifactFolderMutation();
 const updateFolderMutation = useUpdateHtmlArtifactFolderMutation();

 const openCreateFolderDialog = () => {
  const parentFolderId = getConcreteFolderId(activeFolderId);
  setFolderDraft({
   name: "",
   parentFolderId,
   color: folderColorSequence[folders.length % folderColorSequence.length],
  });
  setIsCreateFolderOpen(true);
 };

 const createFolder = async () => {
  const trimmedName = folderDraft.name.trim();
  if (!trimmedName) return;
  try {
   const folder = await createFolderMutation.mutateAsync({
    name: trimmedName,
    parentFolderId: folderDraft.parentFolderId,
    color: folderDraft.color,
    position: folders.length + 1,
   });
   onActiveFolderChange(folder.id);
   setIsCreateFolderOpen(false);
   toast.success("Đã tạo thư mục");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể tạo thư mục"));
  }
 };

 const submitCreateFolder = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  void createFolder();
 };

 const moveArtifactToFolder = async (artifactId: string, folderId: Nullable<string>) => {
  const artifact = artifacts.find((item) => item.id === artifactId);
  if (!artifact || artifact.folderId === folderId) return;
  try {
   await updateMutation.mutateAsync({ artifactId, input: { folderId } });
   toast.success(folderId ? "Đã chuyển tệp vào thư mục" : "Đã bỏ tệp khỏi thư mục");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể chuyển tệp"));
  }
 };

 const moveFolderToParent = async (folderId: string, parentFolderId: Nullable<string>) => {
  const folder = folders.find((item) => item.id === folderId);
  if (!folder || folder.parentFolderId === parentFolderId) return;
  if (
   parentFolderId &&
   (folderId === parentFolderId || hasFolderDescendant(folders, folderId, parentFolderId))
  ) {
   toast.error("Không thể kéo thư mục vào chính nó hoặc thư mục con");
   return;
  }
  try {
   await updateFolderMutation.mutateAsync({ folderId, input: { parentFolderId } });
   toast.success(parentFolderId ? "Đã lồng thư mục" : "Đã đưa thư mục ra ngoài");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể chuyển thư mục"));
  }
 };

 const moveFolderByDirection = async (folderId: string, direction: MoveDirection) => {
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;
  const reordered = reorderHtmlArtifactFolderSiblings(folders, folder, direction);
  if (!reordered) return;
  try {
   await Promise.all(
    reordered.map((item, index) =>
     updateFolderMutation.mutateAsync({ folderId: item.id, input: { position: index + 1 } }),
    ),
   );
   toast.success("Đã sắp xếp thư mục");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể sắp xếp thư mục"));
  }
 };

 const dropOnFolder = (folderId: Nullable<string>) => {
  if (!dragItem) return;
  if (dragItem.type === "artifact") void moveArtifactToFolder(dragItem.id, folderId);
  else void moveFolderToParent(dragItem.id, folderId);
  setDragItem(null);
 };

 return {
  createFolderMutation,
  dragItem,
  dropOnFolder,
  folderDraft,
  isCreateFolderOpen,
  moveFolderByDirection,
  openCreateFolderDialog,
  setDragItem,
  setFolderDraft,
  setIsCreateFolderOpen,
  submitCreateFolder,
  updateFolderMutation,
 };
}
