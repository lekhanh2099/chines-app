"use client";
import type { DragEvent, FormEvent, KeyboardEvent, MouseEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import {
 ArrowDown,
 ArrowUp,
 Code2,
 Copy,
 ExternalLink,
 FileCode2,
 Folder,
 FolderPlus,
 Loader2,
 Maximize2,
 Minimize2,
 PlugZap,
 Plus,
 Save,
 Search,
 Trash2,
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
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
 formatHtmlArtifactDate as formatDate,
 formatHtmlSource,
 getHtmlArtifactApiErrorMessage as getApiErrorMessage,
 getHtmlArtifactTitle as getArtifactTitle,
} from "./html-artifact-display-utils";
import {
 buildFolderTree,
 getArtifactFormSaveKey,
 getDraftSaveLabel,
 getFolderCount,
 hasFolderDescendant,
 parseTags,
 toArtifactFormState,
 type ArtifactFormState,
 type DraftSaveStatus,
 type FolderFilter,
 type FolderTreeNode,
} from "./html-artifact-page-utils";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
 HtmlArtifactRuntimeState,
 HtmlArtifactSummary,
 HtmlArtifactType,
} from "./html-artifact.schema";
import { injectRuntimeStateBridge, isRuntimeStateMessage } from "./html-artifact-runtime-bridge";
import {
 useCreateHtmlArtifactFolderMutation,
 useCreateHtmlArtifactMutation,
 useDeleteHtmlArtifactFolderMutation,
 useDeleteHtmlArtifactMutation,
 useHtmlArtifactQuery,
 useHtmlArtifactRuntimeStateQuery,
 useHtmlArtifactSummariesQuery,
 useUpdateHtmlArtifactRuntimeStateMutation,
 useUpdateHtmlArtifactFolderMutation,
 useUpdateHtmlArtifactMutation,
} from "./useHtmlArtifacts";

const artifactTypeLabels: Record<HtmlArtifactType, string> = {
 practice_page: "Trang luyện tập",
 mock_exam: "Đề thử",
 grammar_drill: "Luyện ngữ pháp",
 reference: "Tài liệu tham khảo",
 other: "Khác",
};

const folderColorClasses: Record<HtmlArtifactFolderColor, string> = {
 blue: "bg-info-subtle text-info-text ring-info/20",
 purple: "bg-purple-subtle text-purple-text ring-purple/20",
 green: "bg-success-subtle text-success-text ring-success/20",
 orange: "bg-warning-subtle text-warning-text ring-warning/20",
 rose: "bg-danger-subtle text-danger-text ring-danger/20",
 slate: "bg-bg-subtle text-text-secondary ring-border-default",
};

const folderColorSwatchClasses: Record<HtmlArtifactFolderColor, string> = {
 blue: "border-info bg-info",
 purple: "border-purple bg-purple",
 green: "border-success bg-success",
 orange: "border-warning bg-warning",
 rose: "border-danger bg-danger",
 slate: "border-border-default bg-text-muted",
};

const folderColorSequence: HtmlArtifactFolderColor[] = [
 "blue",
 "purple",
 "green",
 "orange",
 "rose",
 "slate",
];

const artifactTypes = Object.keys(artifactTypeLabels) as HtmlArtifactType[];
const emptyArtifactSummaries: HtmlArtifactSummary[] = [];
const emptyArtifactFolders: HtmlArtifactFolder[] = [];
const emptyRuntimeState: HtmlArtifactRuntimeState = {};
const noFolderValue = "__none__";
const desktopLayout = {
 "html-artifacts-preview": 72,
 "html-artifacts-inspector": 28,
};
const runtimeStateSaveDelayMs = 2000;
const htmlEditorExtensions = [html({ autoCloseTags: true, matchClosingTags: true })];
type ArtifactSaveOptions = {
 silent?: boolean;
};

type ArtifactSubmitHandler = (
 formState: ArtifactFormState,
 options?: ArtifactSaveOptions,
) => Promise<void> | void;

type PublishConnectionInfo = {
 sessionUserId: string | null;
 publishTokenEnabled: boolean;
 publishOwnerId: string | null;
 serviceRoleEnabled: boolean;
};

type DeleteDialogState =
 | { kind: "artifact"; artifact: HtmlArtifact | HtmlArtifactSummary }
 | { kind: "folder"; folder: HtmlArtifactFolder };

type DragItem = { type: "artifact"; id: string } | { type: "folder"; id: string };

type MobilePane = "files" | "preview" | "edit";
type InspectorTab = "files" | "edit";
type PreviewMode = "iframe" | "editor";

export function HanziHomeHtmlArtifactsPage() {
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const artifactsQuery = useHtmlArtifactSummariesQuery();
 const selectedIdFromUrl = searchParams.get("artifactId");
 const selectedId: string | "new" | null = selectedIdFromUrl === "new" ? "new" : selectedIdFromUrl;
 const [activeFolderId, setActiveFolderId] = useState<FolderFilter>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [mobilePane, setMobilePane] = useState<MobilePane>("preview");
 const [inspectorTab, setInspectorTab] = useState<InspectorTab>("files");
 const [previewMode, setPreviewMode] = useState<PreviewMode>("iframe");
 const [isPreviewFocused, setIsPreviewFocused] = useState(false);
 const [draftPreview, setDraftPreview] = useState<{
  targetId: string;
  form: ArtifactFormState;
 } | null>(null);
 const isDesktopShell = useHtmlArtifactsDesktopShell();
 const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
 const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
 const [folderDraft, setFolderDraft] = useState<{
  name: string;
  parentFolderId: string | null;
  color: HtmlArtifactFolderColor;
 }>({
  name: "",
  parentFolderId: null,
  color: "blue",
 });
 const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
 const [dragItem, setDragItem] = useState<DragItem | null>(null);
 const createMutation = useCreateHtmlArtifactMutation();
 const updateMutation = useUpdateHtmlArtifactMutation();
 const deleteMutation = useDeleteHtmlArtifactMutation();
 const createFolderMutation = useCreateHtmlArtifactFolderMutation();
 const updateFolderMutation = useUpdateHtmlArtifactFolderMutation();
 const deleteFolderMutation = useDeleteHtmlArtifactFolderMutation();
 const updateRuntimeStateMutation = useUpdateHtmlArtifactRuntimeStateMutation();
 const runtimeStateSaveTimerRef = useRef<number | null>(null);
 const latestRuntimeStateSaveRef = useRef<{
  artifactId: string;
  state: HtmlArtifactRuntimeState;
 } | null>(null);

 const artifacts = artifactsQuery.artifacts ?? emptyArtifactSummaries;
 const folders = artifactsQuery.folders ?? emptyArtifactFolders;
 const effectiveSelectedId = selectedId === "new" ? null : (selectedId ?? artifacts[0]?.id ?? null);
 const selectedArtifactQuery = useHtmlArtifactQuery(effectiveSelectedId);
 const selectedArtifact = selectedArtifactQuery.data ?? null;
 const runtimeStateQuery = useHtmlArtifactRuntimeStateQuery(selectedArtifact?.id ?? null);
 const isSaving = createMutation.isPending || updateMutation.isPending;
 const isDeleting = deleteMutation.isPending;
 const isFolderMutating =
  createFolderMutation.isPending ||
  updateFolderMutation.isPending ||
  deleteFolderMutation.isPending;

 const selectedSummary = useMemo(
  () => artifacts.find((artifact) => artifact.id === effectiveSelectedId) ?? null,
  [artifacts, effectiveSelectedId],
 );
 const draftPreviewTargetId = selectedArtifact?.id ?? (selectedId === "new" ? "new" : null);
 const activeDraftPreviewForm =
  draftPreviewTargetId && draftPreview?.targetId === draftPreviewTargetId
   ? draftPreview.form
   : null;
 const updateDraftPreview = (form: ArtifactFormState) => {
  if (!draftPreviewTargetId) return;
  setDraftPreview({ targetId: draftPreviewTargetId, form });
 };

 const previewArtifact = useMemo<HtmlArtifact | null>(() => {
  if (!activeDraftPreviewForm) return selectedArtifact;
  if (!selectedArtifact && !activeDraftPreviewForm.html.trim()) return null;

  const timestamp = selectedArtifact?.updatedAt ?? new Date().toISOString();

  return {
   id: selectedArtifact?.id ?? "draft-preview",
   ownerId: selectedArtifact?.ownerId ?? "draft",
   folderId: activeDraftPreviewForm.folderId,
   title: activeDraftPreviewForm.title,
   artifactType: activeDraftPreviewForm.artifactType,
   tags: parseTags(activeDraftPreviewForm.tagsInput),
   html: activeDraftPreviewForm.html,
   createdAt: selectedArtifact?.createdAt ?? timestamp,
   updatedAt: timestamp,
  };
 }, [activeDraftPreviewForm, selectedArtifact]);

 const filteredArtifacts = useMemo(() => {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return artifacts.filter((artifact) => {
   if (activeFolderId === "unfiled" && artifact.folderId) return false;
   if (activeFolderId !== "all" && activeFolderId !== "unfiled") {
    if (artifact.folderId !== activeFolderId) return false;
   }
   if (!normalizedSearch) return true;

   return [artifact.title, artifact.artifactType, ...artifact.tags]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
  });
 }, [activeFolderId, artifacts, searchQuery]);

 const defaultFolderId =
  activeFolderId !== "all" && activeFolderId !== "unfiled" ? activeFolderId : null;

 const navigateToArtifact = (
  artifactId: string | "new" | null,
  mode: "push" | "replace" = "push",
 ) => {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (artifactId) {
   nextParams.set("artifactId", artifactId);
  } else {
   nextParams.delete("artifactId");
  }

  const queryString = nextParams.toString();
  const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

  if (mode === "replace") {
   router.replace(nextUrl);
   return;
  }

  router.push(nextUrl);
 };

 const queueRuntimeStateSave = (artifactId: string, state: HtmlArtifactRuntimeState) => {
  if (!selectedArtifact || artifactId !== selectedArtifact.id) return;

  latestRuntimeStateSaveRef.current = { artifactId, state };
  if (runtimeStateSaveTimerRef.current) window.clearTimeout(runtimeStateSaveTimerRef.current);

  runtimeStateSaveTimerRef.current = window.setTimeout(() => {
   const payload = latestRuntimeStateSaveRef.current;
   if (!payload) return;

   void updateRuntimeStateMutation
    .mutateAsync({
     artifactId: payload.artifactId,
     input: { state: payload.state },
    })
    .catch(() => {
     toast.error("Không thể sync đáp án trong iframe lên DB");
    });
  }, runtimeStateSaveDelayMs);
 };

 useEffect(() => {
  return () => {
   if (runtimeStateSaveTimerRef.current) window.clearTimeout(runtimeStateSaveTimerRef.current);
  };
 }, []);

 useEffect(() => {
  if (selectedId || artifacts.length === 0) return;
  const firstArtifactId = artifacts[0]?.id;
  if (!firstArtifactId) return;

  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("artifactId", firstArtifactId);
  router.replace(`${pathname}?${nextParams.toString()}`);
 }, [artifacts, pathname, router, searchParams, selectedId]);

 const resetForNewArtifact = () => {
  navigateToArtifact("new");
 };

 const openCreateFolderDialog = () => {
  const parentFolderId =
   activeFolderId !== "all" && activeFolderId !== "unfiled" ? activeFolderId : null;

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
   setActiveFolderId(folder.id);
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

 const moveArtifactToFolder = async (artifactId: string, folderId: string | null) => {
  const artifact = artifacts.find((item) => item.id === artifactId);
  if (!artifact || artifact.folderId === folderId) return;

  try {
   await updateMutation.mutateAsync({
    artifactId,
    input: { folderId },
   });
   toast.success(folderId ? "Đã chuyển tệp vào thư mục" : "Đã bỏ tệp khỏi thư mục");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể chuyển tệp"));
  }
 };

 const moveFolderToParent = async (folderId: string, parentFolderId: string | null) => {
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
   await updateFolderMutation.mutateAsync({
    folderId,
    input: { parentFolderId },
   });
   toast.success(parentFolderId ? "Đã lồng thư mục" : "Đã đưa thư mục ra ngoài");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể chuyển thư mục"));
  }
 };

 const moveFolderByDirection = async (folderId: string, direction: "up" | "down") => {
  const folder = folders.find((item) => item.id === folderId);
  if (!folder) return;

  const siblings = folders
   .filter((item) => item.parentFolderId === folder.parentFolderId)
   .slice()
   .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const currentIndex = siblings.findIndex((item) => item.id === folderId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= siblings.length) return;

  const reordered = siblings.slice();
  const [movedFolder] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, movedFolder);

  try {
   await Promise.all(
    reordered.map((item, index) =>
     updateFolderMutation.mutateAsync({
      folderId: item.id,
      input: { position: index + 1 },
     }),
    ),
   );
   toast.success("Đã sắp xếp thư mục");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể sắp xếp thư mục"));
  }
 };

 const dropOnFolder = (folderId: string | null) => {
  if (!dragItem) return;

  if (dragItem.type === "artifact") {
   void moveArtifactToFolder(dragItem.id, folderId);
  } else {
   void moveFolderToParent(dragItem.id, folderId);
  }

  setDragItem(null);
 };

 const requestDeleteActiveFolder = () => {
  if (activeFolderId === "all" || activeFolderId === "unfiled") return;
  const folder = folders.find((item) => item.id === activeFolderId);
  if (!folder) return;
  setDeleteDialog({ kind: "folder", folder });
 };

 const requestDeleteSelectedArtifact = () => {
  if (!selectedArtifact) return;
  setDeleteDialog({ kind: "artifact", artifact: selectedArtifact });
 };

 const requestDeleteArtifactSummary = (artifact: HtmlArtifactSummary) => {
  setDeleteDialog({ kind: "artifact", artifact });
 };

 const editArtifactHtml = (artifactId: string) => {
  navigateToArtifact(artifactId);
  setPreviewMode("editor");
  setMobilePane("preview");
 };

 const copyArtifactLink = async (artifactId: string) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("artifactId", artifactId);
  const link = `${window.location.origin}${pathname}?${nextParams.toString()}`;

  try {
   await navigator.clipboard.writeText(link);
   toast.success("Đã copy link tệp");
  } catch {
   toast.error("Không copy được link");
  }
 };

 const confirmDelete = async () => {
  if (!deleteDialog) return;

  try {
   if (deleteDialog.kind === "folder") {
    await deleteFolderMutation.mutateAsync(deleteDialog.folder.id);
    setActiveFolderId("all");
    setDeleteDialog(null);
    toast.success("Đã xóa thư mục");
    return;
   }

   await deleteMutation.mutateAsync(deleteDialog.artifact.id);
   toast.success("Đã xóa tệp HTML");
   const nextArtifact =
    filteredArtifacts.find((artifact) => artifact.id !== deleteDialog.artifact.id) ?? null;
   navigateToArtifact(nextArtifact?.id ?? "new", "replace");
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

 const saveArtifact = async (formState: ArtifactFormState, options: ArtifactSaveOptions = {}) => {
  const payload = {
   title: formState.title,
   folderId: formState.folderId,
   artifactType: formState.artifactType,
   tags: parseTags(formState.tagsInput),
   html: formState.html,
  };

  try {
   if (selectedArtifact) {
    const nextArtifact = await updateMutation.mutateAsync({
     artifactId: selectedArtifact.id,
     input: payload,
    });
    navigateToArtifact(nextArtifact.id, "replace");
    if (!options.silent) {
     setMobilePane("preview");
     setPreviewMode("iframe");
     toast.success("Đã lưu tệp HTML");
    }
    return;
   }

   if (options.silent) return;

   const nextArtifact = await createMutation.mutateAsync(payload);
   navigateToArtifact(nextArtifact.id, "replace");
   setMobilePane("preview");
   setPreviewMode("iframe");
   toast.success("Đã tạo tệp HTML");
  } catch (error) {
   if (!options.silent) {
    toast.error(getApiErrorMessage(error, "Không thể lưu tệp HTML"));
   }
   throw error;
  }
 };

 const previewPaneProps = {
  defaultFolderId,
  editorArtifact: selectedArtifact,
  folders,
  isDeleting,
  isFetching:
   (selectedArtifactQuery.isPending && Boolean(effectiveSelectedId)) ||
   (runtimeStateQuery.isPending && Boolean(selectedArtifact)),
  isSaving,
  mode: previewMode,
  runtimeState: runtimeStateQuery.data ?? emptyRuntimeState,
  selectedArtifact: previewArtifact,
  selectedSummary,
  onDelete: requestDeleteSelectedArtifact,
  onDraftChange: updateDraftPreview,
  onModeChange: setPreviewMode,
  onRuntimeStateChange: queueRuntimeStateSave,
  onSubmit: saveArtifact,
  onToggleFocus: () => setIsPreviewFocused((focused) => !focused),
 };

 return (
  <main className="flex h-full min-h-0 w-full flex-col overflow-hidden">
   <CreateFolderDialog
    folderDraft={folderDraft}
    folders={folders}
    isOpen={isCreateFolderOpen}
    isSaving={createFolderMutation.isPending}
    onFolderDraftChange={setFolderDraft}
    onOpenChange={setIsCreateFolderOpen}
    onSubmit={submitCreateFolder}
   />
   <ConfirmDeleteDialog
    deleteDialog={deleteDialog}
    isDeleting={isDeleting || deleteFolderMutation.isPending}
    onCancel={() => setDeleteDialog(null)}
    onConfirm={() => void confirmDelete()}
    onOpenChange={(open) => {
     if (!open) setDeleteDialog(null);
    }}
   />
   <PublishConnectionDialog
    selectedArtifact={selectedArtifact}
    isOpen={isPublishDialogOpen}
    onOpenChange={setIsPublishDialogOpen}
   />

   {!isDesktopShell && isPreviewFocused ? (
    <div className="min-h-0 flex-1 overflow-hidden">
     <PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />
    </div>
   ) : null}

   {!isDesktopShell && !isPreviewFocused ? (
    <div className="html-artifacts-mobile-shell flex min-h-0 flex-1 flex-col overflow-hidden">
     <MobilePaneTabs activePane={mobilePane} onChange={setMobilePane} />
     <div className="min-h-0 flex-1 overflow-hidden">
      {mobilePane === "files" ? (
       <DirectoryPane
        activeFolderId={activeFolderId}
        artifacts={artifacts}
        folders={folders}
        filteredArtifacts={filteredArtifacts}
        dragItem={dragItem}
        isLoading={artifactsQuery.isLoading}
        error={artifactsQuery.error}
        searchQuery={searchQuery}
        selectedId={effectiveSelectedId}
        isFolderMutating={isFolderMutating}
        onCreateArtifact={() => {
         resetForNewArtifact();
         setPreviewMode("editor");
         setMobilePane("preview");
        }}
        onCreateFolder={openCreateFolderDialog}
        onCopyArtifactLink={(artifactId) => void copyArtifactLink(artifactId)}
        onDeleteArtifact={requestDeleteArtifactSummary}
        onEditArtifact={editArtifactHtml}
        onDeleteActiveFolder={requestDeleteActiveFolder}
        onDragEnd={() => setDragItem(null)}
        onDragStart={setDragItem}
        onDropOnFolder={dropOnFolder}
        onSearchChange={setSearchQuery}
        onSelectArtifact={(artifactId) => {
         navigateToArtifact(artifactId);
         setMobilePane("preview");
        }}
        onSelectFolder={setActiveFolderId}
        onReorderFolder={moveFolderByDirection}
       />
      ) : null}
      {mobilePane === "preview" ? (
       <PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />
      ) : null}
      {mobilePane === "edit" ? (
       <EditorPane
        key={selectedArtifact?.id ?? `new-${defaultFolderId ?? "none"}`}
        artifact={selectedArtifact}
        defaultFolderId={defaultFolderId}
        folders={folders}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onDraftChange={updateDraftPreview}
        onSubmit={saveArtifact}
        onDelete={requestDeleteSelectedArtifact}
       />
      ) : null}
     </div>
    </div>
   ) : null}

   {isDesktopShell && isPreviewFocused ? (
    <div className="min-h-0 flex-1 overflow-hidden">
     <PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />
    </div>
   ) : null}

   {isDesktopShell && !isPreviewFocused ? (
    <ResizablePanelGroup
     id="html-artifacts-panels"
     key="html-artifacts-layout-v3"
     orientation="horizontal"
     defaultLayout={desktopLayout}
     className="html-artifacts-desktop-shell min-h-0 min-w-0 flex-1 overflow-hidden bg-border-default"
    >
     <ResizablePanel
      id="html-artifacts-preview"
      defaultSize={`${desktopLayout["html-artifacts-preview"]}%`}
      minSize="52%"
      className="min-h-0 min-w-0 overflow-hidden"
     >
      <PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />
     </ResizablePanel>
     <ResizableHandle />
     <ResizablePanel
      id="html-artifacts-inspector"
      defaultSize={`${desktopLayout["html-artifacts-inspector"]}%`}
      minSize="24%"
      maxSize="42%"
      className="min-h-0 min-w-0 overflow-hidden"
     >
      <RightInspectorPane
       activeFolderId={activeFolderId}
       activeTab={inspectorTab}
       artifact={selectedArtifact}
       artifacts={artifacts}
       defaultFolderId={defaultFolderId}
       dragItem={dragItem}
       error={artifactsQuery.error}
       filteredArtifacts={filteredArtifacts}
       folders={folders}
       isDeleting={isDeleting}
       isFolderMutating={isFolderMutating}
       isLoading={artifactsQuery.isLoading}
       isSaving={isSaving}
       searchQuery={searchQuery}
       selectedId={effectiveSelectedId}
       onCreateArtifact={() => {
        resetForNewArtifact();
        setPreviewMode("editor");
       }}
       onCreateFolder={openCreateFolderDialog}
       onDelete={requestDeleteSelectedArtifact}
       onDeleteActiveFolder={requestDeleteActiveFolder}
       onDragEnd={() => setDragItem(null)}
       onDragStart={setDragItem}
       onDropOnFolder={dropOnFolder}
       onSearchChange={setSearchQuery}
       onSelectArtifact={navigateToArtifact}
       onSelectFolder={setActiveFolderId}
       onReorderFolder={moveFolderByDirection}
       onOpenPublishDialog={() => setIsPublishDialogOpen(true)}
       onCopyArtifactLink={(artifactId) => void copyArtifactLink(artifactId)}
       onDeleteArtifact={requestDeleteArtifactSummary}
       onEditArtifact={editArtifactHtml}
       onDraftChange={updateDraftPreview}
       onSubmit={saveArtifact}
       onTabChange={setInspectorTab}
      />
     </ResizablePanel>
    </ResizablePanelGroup>
   ) : null}
  </main>
 );
}

function MobilePaneTabs({
 activePane,
 onChange,
}: {
 activePane: MobilePane;
 onChange: (pane: MobilePane) => void;
}) {
 const panes: Array<{ key: MobilePane; label: string; icon: typeof Folder }> = [
  { key: "files", label: "Tệp", icon: Folder },
  { key: "preview", label: "Xem trước", icon: Code2 },
  { key: "edit", label: "Sửa", icon: FileCode2 },
 ];

 return (
  <div className="shrink-0 border-b border-border-default bg-bg-card p-2">
   <div
    role="tablist"
    aria-label="Chọn vùng tệp HTML"
    className="grid grid-cols-3 gap-1 rounded-xl bg-bg-subtle p-1"
   >
    {panes.map((pane) => {
     const Icon = pane.icon;
     const active = activePane === pane.key;

     return (
      <button
       key={pane.key}
       type="button"
       role="tab"
       aria-selected={active}
       className={cn(
        "inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition-colors",
        active
         ? "app-active-item border"
         : "text-text-muted hover:bg-bg-card/70 hover:text-text-primary",
       )}
       onClick={() => onChange(pane.key)}
      >
       <Icon className="h-3.5 w-3.5 shrink-0" />
       <span className="truncate">{pane.label}</span>
      </button>
     );
    })}
   </div>
  </div>
 );
}

function RightInspectorPane({
 activeFolderId,
 activeTab,
 artifact,
 artifacts,
 defaultFolderId,
 dragItem,
 error,
 filteredArtifacts,
 folders,
 isDeleting,
 isFolderMutating,
 isLoading,
 isSaving,
 searchQuery,
 selectedId,
 onCreateArtifact,
 onCreateFolder,
 onCopyArtifactLink,
 onDeleteArtifact,
 onDelete,
 onDeleteActiveFolder,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onEditArtifact,
 onSearchChange,
 onSelectArtifact,
 onSelectFolder,
 onReorderFolder,
 onOpenPublishDialog,
 onDraftChange,
 onSubmit,
 onTabChange,
}: {
 activeFolderId: FolderFilter;
 activeTab: InspectorTab;
 artifact: HtmlArtifact | null;
 artifacts: HtmlArtifactSummary[];
 defaultFolderId: string | null;
 dragItem: DragItem | null;
 error: unknown;
 filteredArtifacts: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
 isDeleting: boolean;
 isFolderMutating: boolean;
 isLoading: boolean;
 isSaving: boolean;
 searchQuery: string;
 selectedId: string | null;
 onCreateArtifact: () => void;
 onCreateFolder: () => void;
 onCopyArtifactLink: (artifactId: string) => void;
 onDeleteArtifact: (artifact: HtmlArtifactSummary) => void;
 onDelete: () => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onEditArtifact: (artifactId: string) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 onReorderFolder: (folderId: string, direction: "up" | "down") => void;
 onOpenPublishDialog: () => void;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onTabChange: (tab: InspectorTab) => void;
}) {
 return (
  <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l-2 border-border-default bg-bg-card">
   <div className="flex h-14 shrink-0 items-center border-b border-border-default bg-bg-card px-3">
    <div
     role="tablist"
     aria-label="HTML inspector"
     className="grid w-full grid-cols-2 gap-1 rounded-xl bg-bg-subtle p-1"
    >
     <InspectorTabButton
      active={activeTab === "files"}
      icon={Folder}
      label="Tệp"
      count={filteredArtifacts.length}
      onClick={() => onTabChange("files")}
     />
     <InspectorTabButton
      active={false}
      icon={PlugZap}
      label="Kết nối"
      onClick={onOpenPublishDialog}
     />
    </div>
   </div>

   <div className="min-h-0 flex-1 overflow-hidden bg-bg-subtle">
    {activeTab === "files" ? (
     <DirectoryPane
      activeFolderId={activeFolderId}
      artifacts={artifacts}
      folders={folders}
      filteredArtifacts={filteredArtifacts}
      dragItem={dragItem}
      embedded
      isLoading={isLoading}
      error={error}
      searchQuery={searchQuery}
      selectedId={selectedId}
      isFolderMutating={isFolderMutating}
      onCreateArtifact={onCreateArtifact}
      onCreateFolder={onCreateFolder}
      onCopyArtifactLink={onCopyArtifactLink}
      onDeleteArtifact={onDeleteArtifact}
      onDeleteActiveFolder={onDeleteActiveFolder}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDropOnFolder={onDropOnFolder}
      onEditArtifact={onEditArtifact}
      onSearchChange={onSearchChange}
      onSelectArtifact={onSelectArtifact}
      onSelectFolder={onSelectFolder}
      onReorderFolder={onReorderFolder}
     />
    ) : (
     <EditorPane
      key={artifact?.id ?? `new-${defaultFolderId ?? "none"}`}
      artifact={artifact}
      defaultFolderId={defaultFolderId}
      folders={folders}
      embedded
      isSaving={isSaving}
      isDeleting={isDeleting}
      onDraftChange={onDraftChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
     />
    )}
   </div>
  </aside>
 );
}

function InspectorTabButton({
 active,
 count,
 icon: Icon,
 label,
 onClick,
}: {
 active: boolean;
 count?: number;
 icon: typeof Folder;
 label: string;
 onClick: () => void;
}) {
 return (
  <button
   type="button"
   role="tab"
   aria-selected={active}
   className={cn(
    "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-black transition-colors",
    active
     ? "app-active-item border"
     : "text-text-muted hover:bg-bg-card/70 hover:text-text-primary",
   )}
   onClick={onClick}
  >
   <Icon className="h-4 w-4 shrink-0" />
   <span className="truncate">{label}</span>
   {typeof count === "number" ? (
    <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[0.68rem] text-text-muted">
     {count}
    </span>
   ) : null}
  </button>
 );
}

function useHtmlArtifactsDesktopShell() {
 const [isDesktopShell, setIsDesktopShell] = useState(false);

 useEffect(() => {
  const query = window.matchMedia("(min-width: 1280px)");
  const updateShell = () => setIsDesktopShell(query.matches);

  updateShell();
  query.addEventListener("change", updateShell);

  return () => {
   query.removeEventListener("change", updateShell);
  };
 }, []);

 return isDesktopShell;
}

function DirectoryPane({
 activeFolderId,
 artifacts,
 embedded = false,
 folders,
 filteredArtifacts,
 dragItem,
 isLoading,
 error,
 searchQuery,
 selectedId,
 isFolderMutating,
 onCreateArtifact,
 onCreateFolder,
 onCopyArtifactLink,
 onDeleteArtifact,
 onDeleteActiveFolder,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onEditArtifact,
 onSearchChange,
 onSelectArtifact,
 onSelectFolder,
 onReorderFolder,
}: {
 activeFolderId: FolderFilter;
 artifacts: HtmlArtifactSummary[];
 embedded?: boolean;
 folders: HtmlArtifactFolder[];
 filteredArtifacts: HtmlArtifactSummary[];
 dragItem: DragItem | null;
 isLoading: boolean;
 error: unknown;
 searchQuery: string;
 selectedId: string | null;
 isFolderMutating: boolean;
 onCreateArtifact: () => void;
 onCreateFolder: () => void;
 onCopyArtifactLink: (artifactId: string) => void;
 onDeleteArtifact: (artifact: HtmlArtifactSummary) => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onEditArtifact: (artifactId: string) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 onReorderFolder: (folderId: string, direction: "up" | "down") => void;
}) {
 const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

 return (
  <aside
   className={cn(
    "flex h-full min-h-0 flex-col overflow-hidden bg-bg-primary",
    !embedded && "border-r border-border-default",
   )}
  >
   <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-card px-4">
    <div className="flex min-w-0 items-center gap-2">
     <h2 className="text-sm font-black text-text-primary">Thư mục</h2>
     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {folders.length}
     </span>
    </div>
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="shrink-0"
     disabled={isFolderMutating}
     onClick={onCreateFolder}
    >
     <FolderPlus className="h-4 w-4" />
     Thư mục mới
    </Button>
   </div>

   <div className="grid shrink-0 gap-2 border-b border-border-default bg-bg-card p-3">
    <div className="relative">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <Input
      value={searchQuery}
      onChange={(event) => onSearchChange(event.target.value)}
      aria-label="Tìm tệp HTML"
      placeholder="Tìm tệp"
      className="h-10 pl-9"
     />
    </div>
   </div>

   <div className="max-h-64 shrink-0 overflow-y-auto border-b border-border-default bg-bg-subtle p-3 scrollbar-soft">
    <div className="grid gap-1.5">
     <FolderRow
      active={activeFolderId === "all"}
      count={getFolderCount(artifacts, "all")}
      name="Tất cả"
      color="slate"
      depth={0}
      dragItem={dragItem}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onClick={() => onSelectFolder("all")}
      onDrop={() => onDropOnFolder(null)}
     />
     <FolderRow
      active={activeFolderId === "unfiled"}
      count={getFolderCount(artifacts, "unfiled")}
      name="Chưa phân loại"
      color="slate"
      acceptsFolderDrop={false}
      depth={0}
      dragItem={dragItem}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onClick={() => onSelectFolder("unfiled")}
      onDrop={() => onDropOnFolder(null)}
     />
     {folderTree.map((folder) => (
      <FolderTreeRow
       key={folder.id}
       activeFolderId={activeFolderId}
       artifacts={artifacts}
       dragItem={dragItem}
       folder={folder}
       siblings={folders.filter((item) => item.parentFolderId === folder.parentFolderId)}
       onDragEnd={onDragEnd}
       onDragStart={onDragStart}
       onDropOnFolder={onDropOnFolder}
       onReorderFolder={onReorderFolder}
       onSelectFolder={onSelectFolder}
      />
     ))}
    </div>
    {activeFolderId !== "all" && activeFolderId !== "unfiled" ? (
     <Button
      type="button"
      variant="ghost"
      size="sm"
      className="justify-start text-danger hover:bg-danger-subtle"
      disabled={isFolderMutating}
      onClick={onDeleteActiveFolder}
     >
      <Trash2 className="h-4 w-4" />
      Xóa thư mục
     </Button>
    ) : null}
   </div>

   <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-subtle px-4">
    <div className="flex min-w-0 items-center gap-2">
     <h3 className="text-sm font-black text-text-primary">Tệp</h3>
     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {filteredArtifacts.length}
     </span>
    </div>
    <div className="flex shrink-0 items-center gap-2">
     <Button type="button" size="sm" onClick={onCreateArtifact}>
      <Plus className="h-4 w-4" />
      Tệp mới
     </Button>
    </div>
   </div>

   <div className="min-h-0 flex-1 overflow-y-auto bg-bg-subtle px-3 pb-4 pt-2 scrollbar-soft">
    {isLoading && <ArtifactDirectorySkeleton />}

    {Boolean(error) && (
     <p
      role="alert"
      className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-bold text-destructive"
     >
      Không tải được tệp HTML.
     </p>
    )}

    {!isLoading && !error && filteredArtifacts.length === 0 && (
     <p className="rounded-lg border border-dashed border-border-default bg-bg-subtle p-3 text-sm font-bold text-text-muted">
      Thư mục này chưa có tệp.
     </p>
    )}

    {filteredArtifacts.length > 0 && (
     <div className="grid gap-2.5">
      {filteredArtifacts.map((artifact) => (
       <ArtifactListButton
        key={artifact.id}
        artifact={artifact}
        active={artifact.id === selectedId}
        onCopyLink={() => onCopyArtifactLink(artifact.id)}
        onDelete={() => onDeleteArtifact(artifact)}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onEdit={() => onEditArtifact(artifact.id)}
        onClick={() => onSelectArtifact(artifact.id)}
       />
      ))}
     </div>
    )}
   </div>
  </aside>
 );
}

function FolderRow({
 acceptsFolderDrop = true,
 active,
 color,
 count,
 depth,
 dragItem,
 name,
 folderId,
 canMoveDown = false,
 canMoveUp = false,
 onDragEnd,
 onDragStart,
 onClick,
 onMoveDown,
 onMoveUp,
 onDrop,
}: {
 acceptsFolderDrop?: boolean;
 active: boolean;
 color: HtmlArtifactFolderColor;
 count: number;
 depth: number;
 dragItem: DragItem | null;
 name: string;
 folderId?: string;
 canMoveDown?: boolean;
 canMoveUp?: boolean;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onClick: () => void;
 onMoveDown?: () => void;
 onMoveUp?: () => void;
 onDrop: () => void;
}) {
 const isCoarsePointer = useCoarsePointer();
 const canDrop =
  dragItem?.type === "artifact" ||
  (dragItem?.type === "folder" && acceptsFolderDrop && dragItem.id !== folderId);

 const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
  if (!canDrop) return;
  event.preventDefault();
 };

 const handleDrop = (event: DragEvent<HTMLDivElement>) => {
  if (!canDrop) return;
  event.preventDefault();
  onDrop();
 };

 return (
  <div
   draggable={Boolean(folderId) && !isCoarsePointer}
   onDragStart={() => {
    if (folderId) onDragStart({ type: "folder", id: folderId });
   }}
   onDragEnd={onDragEnd}
   onDragOver={handleDragOver}
   onDrop={handleDrop}
   className={cn(
    "group flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg border px-2 text-left text-sm font-bold transition-colors",
    active
     ? "app-active-item"
     : "border-border-default bg-bg-primary text-text-secondary hover:border-primary/25 hover:bg-bg-subtle hover:text-text-primary",
    canDrop && "data-[drag-over=true]:border-primary/50",
   )}
   style={{ paddingLeft: `${8 + depth * 16}px` }}
  >
   <button
    type="button"
    className="flex min-h-9 min-w-0 flex-1 items-center gap-2 text-left"
    onClick={onClick}
   >
    <span
     className={cn(
      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1",
      folderColorClasses[color],
     )}
    >
     <Folder className="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 flex-1 truncate">{name}</span>
    <span className="rounded-full bg-bg-card px-1.5 text-[0.68rem] text-text-muted">{count}</span>
   </button>
   {folderId ? (
    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
     <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-card hover:text-text-primary disabled:opacity-30"
      aria-label={`Đưa ${name} lên`}
      disabled={!canMoveUp}
      onClick={(event) => {
       event.stopPropagation();
       onMoveUp?.();
      }}
     >
      <ArrowUp className="h-3.5 w-3.5" />
     </button>
     <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-card hover:text-text-primary disabled:opacity-30"
      aria-label={`Đưa ${name} xuống`}
      disabled={!canMoveDown}
      onClick={(event) => {
       event.stopPropagation();
       onMoveDown?.();
      }}
     >
      <ArrowDown className="h-3.5 w-3.5" />
     </button>
    </span>
   ) : null}
  </div>
 );
}

function FolderTreeRow({
 activeFolderId,
 artifacts,
 dragItem,
 folder,
 siblings,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onReorderFolder,
 onSelectFolder,
 depth = 0,
}: {
 activeFolderId: FolderFilter;
 artifacts: HtmlArtifactSummary[];
 dragItem: DragItem | null;
 folder: FolderTreeNode;
 siblings: HtmlArtifactFolder[];
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onReorderFolder: (folderId: string, direction: "up" | "down") => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 depth?: number;
}) {
 const siblingIds = siblings
  .slice()
  .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
  .map((item) => item.id);
 const siblingIndex = siblingIds.indexOf(folder.id);

 return (
  <>
   <FolderRow
    active={activeFolderId === folder.id}
    canMoveDown={siblingIndex >= 0 && siblingIndex < siblingIds.length - 1}
    canMoveUp={siblingIndex > 0}
    count={getFolderCount(artifacts, folder.id)}
    depth={depth}
    dragItem={dragItem}
    folderId={folder.id}
    name={folder.name}
    color={folder.color}
    onDragEnd={onDragEnd}
    onDragStart={onDragStart}
    onClick={() => onSelectFolder(folder.id)}
    onMoveDown={() => onReorderFolder(folder.id, "down")}
    onMoveUp={() => onReorderFolder(folder.id, "up")}
    onDrop={() => onDropOnFolder(folder.id)}
   />
   {folder.children.map((child) => (
    <FolderTreeRow
     key={child.id}
     activeFolderId={activeFolderId}
     artifacts={artifacts}
     dragItem={dragItem}
     folder={child}
     siblings={folder.children}
     depth={depth + 1}
     onDragEnd={onDragEnd}
     onDragStart={onDragStart}
     onDropOnFolder={onDropOnFolder}
     onReorderFolder={onReorderFolder}
     onSelectFolder={onSelectFolder}
    />
   ))}
  </>
 );
}

function PreviewPane({
 defaultFolderId,
 editorArtifact,
 folders,
 isFocused,
 isDeleting,
 isSaving,
 mode,
 selectedArtifact,
 selectedSummary,
 runtimeState,
 isFetching,
 onDelete,
 onDraftChange,
 onModeChange,
 onRuntimeStateChange,
 onSubmit,
 onToggleFocus,
}: {
 defaultFolderId: string | null;
 editorArtifact: HtmlArtifact | null;
 folders: HtmlArtifactFolder[];
 isFocused: boolean;
 isDeleting: boolean;
 isSaving: boolean;
 mode: PreviewMode;
 selectedArtifact: HtmlArtifact | null;
 selectedSummary: HtmlArtifactSummary | null;
 runtimeState: HtmlArtifactRuntimeState;
 isFetching: boolean;
 onDelete: () => void;
 onDraftChange: (formState: ArtifactFormState) => void;
 onModeChange: (mode: PreviewMode) => void;
 onRuntimeStateChange: (artifactId: string, state: HtmlArtifactRuntimeState) => void;
 onSubmit: ArtifactSubmitHandler;
 onToggleFocus: () => void;
}) {
 const iframeRef = useRef<HTMLIFrameElement | null>(null);
 const iframeSrcDoc =
  selectedArtifact && !isFetching
   ? injectRuntimeStateBridge(selectedArtifact.html, selectedArtifact.id, runtimeState)
   : "";

 useEffect(() => {
  const handleMessage = (event: MessageEvent<unknown>) => {
   if (event.source !== iframeRef.current?.contentWindow) return;
   if (!isRuntimeStateMessage(event.data)) return;

   onRuntimeStateChange(event.data.artifactId, event.data.state);
  };

  window.addEventListener("message", handleMessage);

  return () => {
   window.removeEventListener("message", handleMessage);
  };
 }, [onRuntimeStateChange]);

 return (
  <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-x border-border-default bg-bg-card">
   <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-card px-4">
    <div className="min-w-0">
     <h2 className="truncate text-sm font-black text-text-primary">
      {getArtifactTitle(selectedArtifact ?? selectedSummary)}
     </h2>
     <p className="truncate text-sm font-medium text-text-muted">
      {selectedArtifact?.updatedAt
       ? `Cập nhật ${formatDate(selectedArtifact.updatedAt)}`
       : "Xem trước"}
     </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
     <div
      role="tablist"
      aria-label="Chọn chế độ xem HTML"
      className="flex rounded-xl bg-bg-subtle p-1"
     >
      <PreviewModeButton
       active={mode === "iframe"}
       icon={Code2}
       label="iframe"
       onClick={() => onModeChange("iframe")}
      />
      <PreviewModeButton
       active={mode === "editor"}
       icon={FileCode2}
       label="Chỉnh HTML"
       onClick={() => onModeChange("editor")}
      />
     </div>
     <Button type="button" variant="outline" size="sm" onClick={onToggleFocus}>
      {isFocused ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      {isFocused ? "Thu nhỏ" : "Phóng to"}
     </Button>
    </div>
   </div>

   <div
    className={cn(
     "min-h-0 flex-1",
     mode === "editor" ? "overflow-hidden" : "overflow-auto bg-white",
    )}
   >
    {mode === "editor" ? (
     <EditorPane
      key={editorArtifact?.id ?? `new-${defaultFolderId ?? "none"}`}
      artifact={editorArtifact}
      defaultFolderId={defaultFolderId}
      folders={folders}
      htmlOnly
      isSaving={isSaving}
      isDeleting={isDeleting}
      onDraftChange={onDraftChange}
      onSubmit={onSubmit}
      onDelete={onDelete}
     />
    ) : isFetching ? (
     <HtmlArtifactPreviewSkeleton />
    ) : selectedArtifact ? (
     <StableHtmlArtifactIframe
      key={getHtmlArtifactFrameKey(selectedArtifact.id, selectedArtifact.html)}
      artifact={selectedArtifact}
      initialSrcDoc={iframeSrcDoc}
      iframeRef={iframeRef}
     />
    ) : (
     <div className="flex h-full items-center justify-center p-6 text-center text-sm font-bold text-text-muted">
      Chọn một tệp đã lưu hoặc dán HTML rồi bấm Lưu.
     </div>
    )}
   </div>
  </section>
 );
}

function ArtifactDirectorySkeleton() {
 return (
  <div className="grid animate-pulse gap-2" aria-busy="true" aria-live="polite">
   {Array.from({ length: 5 }, (_, index) => (
    <div
     key={index}
     className="flex min-h-14 items-center gap-3 rounded-lg border border-border-default bg-bg-card p-3"
    >
     <div className="size-8 shrink-0 rounded-lg bg-bg-subtle" />
     <div className="grid min-w-0 flex-1 gap-2">
      <div className="h-4 w-3/4 rounded-md bg-bg-subtle" />
      <div className="h-3 w-1/2 rounded-full bg-bg-subtle" />
     </div>
    </div>
   ))}
   <span className="sr-only">Đang tải danh sách tệp HTML</span>
  </div>
 );
}

function HtmlArtifactPreviewSkeleton() {
 return (
  <div
   className="grid h-full animate-pulse content-start gap-4 bg-bg-primary p-5"
   aria-busy="true"
   aria-live="polite"
  >
   <div className="h-8 w-64 max-w-full rounded-lg bg-bg-subtle" />
   <div className="h-4 w-96 max-w-full rounded-md bg-bg-subtle" />
   <div className="grid gap-3 sm:grid-cols-2">
    <div className="h-40 rounded-xl bg-bg-subtle" />
    <div className="h-40 rounded-xl bg-bg-subtle" />
   </div>
   <div className="h-56 rounded-xl bg-bg-subtle" />
   <span className="sr-only">Đang tải bản xem trước HTML</span>
  </div>
 );
}

function PreviewModeButton({
 active,
 icon: Icon,
 label,
 onClick,
}: {
 active: boolean;
 icon: typeof Code2;
 label: string;
 onClick: () => void;
}) {
 return (
  <button
   type="button"
   role="tab"
   aria-selected={active}
   className={cn(
    "inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition-colors",
    active
     ? "app-active-item border"
     : "text-text-muted hover:bg-bg-card/70 hover:text-text-primary",
   )}
   onClick={onClick}
  >
   <Icon className="h-3.5 w-3.5 shrink-0" />
   <span className="truncate">{label}</span>
  </button>
 );
}

function getHtmlArtifactFrameKey(artifactId: string, html: string) {
 let hash = 0;

 for (let index = 0; index < html.length; index += 1) {
  hash = (hash * 31 + html.charCodeAt(index)) >>> 0;
 }

 return `${artifactId}-${html.length}-${hash.toString(36)}`;
}

function StableHtmlArtifactIframe({
 artifact,
 initialSrcDoc,
 iframeRef,
}: {
 artifact: HtmlArtifact;
 initialSrcDoc: string;
 iframeRef: RefObject<HTMLIFrameElement | null>;
}) {
 const [frameSrc] = useState(() =>
  URL.createObjectURL(new Blob([initialSrcDoc], { type: "text/html;charset=utf-8" })),
 );

 useEffect(() => {
  return () => {
   URL.revokeObjectURL(frameSrc);
  };
 }, [frameSrc]);

 return (
  <iframe
   ref={iframeRef}
   title={artifact.title}
   sandbox="allow-scripts allow-modals"
   referrerPolicy="no-referrer"
   src={frameSrc}
   className="h-full min-h-[32rem] w-full border-0"
  />
 );
}

function maskToken(token: string) {
 if (token.length <= 24) return "••••";

 return `${token.slice(0, 12)}...${token.slice(-8)}`;
}

function parsePublishConnectionInfo(value: unknown): PublishConnectionInfo | null {
 if (!value || typeof value !== "object") return null;

 const item = value as Partial<Record<keyof PublishConnectionInfo, unknown>>;

 return {
  sessionUserId: typeof item.sessionUserId === "string" ? item.sessionUserId : null,
  publishTokenEnabled: item.publishTokenEnabled === true,
  publishOwnerId: typeof item.publishOwnerId === "string" ? item.publishOwnerId : null,
  serviceRoleEnabled: item.serviceRoleEnabled === true,
 };
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid gap-1 rounded-lg border border-border-default bg-bg-subtle px-3 py-2">
   <span className="text-[0.68rem] font-black uppercase text-text-muted">{label}</span>
   <span className="break-all font-mono text-xs font-bold text-text-primary">{value}</span>
  </div>
 );
}

function PublishConnectionDialog({
 selectedArtifact,
 isOpen,
 onOpenChange,
}: {
 selectedArtifact: HtmlArtifact | null;
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 const endpointPath = "/api/hanzihome/html-artifacts/publish";
 const displayEndpoint = `https://your-domain.com${endpointPath}`;
 const supabase = useMemo(() => createBrowserSupabaseClient(), []);
 const [connectionInfo, setConnectionInfo] = useState<PublishConnectionInfo | null>(null);
 const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(null);
 const [isLoadingConnection, setIsLoadingConnection] = useState(false);
 const exampleArtifactId = selectedArtifact?.id ?? "optional-stable-uuid";
 const exampleTitle = selectedArtifact?.title ?? "SC3 Mock Exam 04";
 const exampleType = selectedArtifact?.artifactType ?? "practice_page";
 const exampleTags = selectedArtifact?.tags.length ? selectedArtifact.tags : ["SC3", "mock"];
 const exampleHtml = selectedArtifact?.html
  ? selectedArtifact.html.slice(0, 96).trim()
  : '<!doctype html><html lang="vi"><head><meta charset="utf-8" /></head><body>...</body></html>';
 const buildFetchSnippet = (endpoint: string) => `await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <supabase-user-access-token-or-publish-token>"
  },
  body: JSON.stringify({
    mode: "upsert",
    artifactId: "${exampleArtifactId}",
    title: ${JSON.stringify(exampleTitle)},
    artifactType: "${exampleType}",
    tags: ${JSON.stringify(exampleTags)},
    folderId: null,
    html: ${JSON.stringify(exampleHtml)}
  })
});`;
 const displayFetchSnippet = buildFetchSnippet(displayEndpoint);
 const getCurrentEndpoint = () => {
  if (typeof window === "undefined") return displayEndpoint;

  return new URL(endpointPath, window.location.origin).toString();
 };
 const tokenPreview = sessionAccessToken ? maskToken(sessionAccessToken) : "Chưa có session token";

 const copyText = async (text: string, successMessage: string) => {
  try {
   await navigator.clipboard.writeText(text);
   toast.success(successMessage);
  } catch {
   toast.error("Không copy được. Chọn text rồi copy thủ công.");
  }
 };

 useEffect(() => {
  if (!isOpen) return;

  let ignore = false;

  const loadConnectionInfo = async () => {
   setIsLoadingConnection(true);
   try {
    const [statusResponse, sessionResult] = await Promise.all([
     fetch(endpointPath, {
      method: "GET",
      headers: { Accept: "application/json" },
     }),
     supabase.auth.getSession(),
    ]);

    const statusJson: unknown = await statusResponse.json().catch(() => null);
    if (ignore) return;

    setConnectionInfo(parsePublishConnectionInfo(statusJson));
    setSessionAccessToken(sessionResult.data.session?.access_token ?? null);
   } catch {
    if (!ignore) {
     setConnectionInfo(null);
     setSessionAccessToken(null);
    }
   } finally {
    if (!ignore) setIsLoadingConnection(false);
   }
  };

  void loadConnectionInfo();

  return () => {
   ignore = true;
  };
 }, [isOpen, supabase]);

 return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-2xl">
    <DialogHeader>
     <DialogTitle className="flex items-center gap-2">
      <PlugZap className="h-5 w-5 text-primary" />
      Kết nối publish HTML
     </DialogTitle>
     <DialogDescription>
      Dùng endpoint này để tool khác gửi HTML vào Tệp HTML mà không cần mở app rồi copy paste.
     </DialogDescription>
    </DialogHeader>

    <DialogBody>
     <div className="grid gap-4">
      <section className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
       <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
         <p className="text-xs font-black uppercase text-text-muted">Endpoint</p>
         <p className="break-all font-mono text-sm font-bold text-text-primary">{endpointPath}</p>
         <p className="mt-1 text-xs font-bold text-text-muted">
          Copy sẽ tự dùng domain hiện tại của app.
         </p>
        </div>
        <Button
         type="button"
         variant="outline"
         size="sm"
         className="shrink-0"
         onClick={() => void copyText(getCurrentEndpoint(), "Đã copy endpoint")}
        >
         <Copy className="h-4 w-4" />
         Copy
        </Button>
       </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
       <div className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-3">
        <div>
         <p className="text-sm font-black text-text-primary">Auth user token</p>
         <p className="mt-1 text-sm font-semibold text-text-muted">
          Gửi Supabase access token trong header. DB chỉ cho ghi tệp của owner này.
         </p>
        </div>
        <KeyValueRow label="Owner" value={connectionInfo?.sessionUserId ?? "Đang đọc..."} />
        <KeyValueRow label="Token" value={isLoadingConnection ? "Đang đọc..." : tokenPreview} />
        <Button
         type="button"
         variant="outline"
         size="sm"
         disabled={!sessionAccessToken}
         onClick={() =>
          sessionAccessToken
           ? void copyText(sessionAccessToken, "Đã copy auth user token")
           : toast.error("Không có session token để copy")
         }
        >
         <Copy className="h-4 w-4" />
         Copy auth token
        </Button>
       </div>
       <div className="grid gap-3 rounded-xl border border-border-default bg-bg-card p-3">
        <div>
         <p className="text-sm font-black text-text-primary">Publish token</p>
         <p className="mt-1 text-sm font-semibold text-text-muted">
          Token này nằm trong env server; UI chỉ show trạng thái và owner đang nhận file.
         </p>
        </div>
        <KeyValueRow
         label="Status"
         value={
          connectionInfo?.publishTokenEnabled
           ? "Đã cấu hình"
           : isLoadingConnection
             ? "Đang đọc..."
             : "Chưa cấu hình"
         }
        />
        <KeyValueRow label="Owner" value={connectionInfo?.publishOwnerId ?? "Chưa cấu hình"} />
        <KeyValueRow
         label="Service role"
         value={connectionInfo?.serviceRoleEnabled ? "Sẵn sàng" : "Chưa cấu hình"}
        />
       </div>
      </div>

      <section className="grid gap-2">
       <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-text-primary">Ví dụ fetch</p>
        <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={() =>
          void copyText(buildFetchSnippet(getCurrentEndpoint()), "Đã copy ví dụ fetch")
         }
        >
         <Copy className="h-4 w-4" />
         Copy code
        </Button>
       </div>
       <pre className="max-h-80 overflow-auto rounded-xl border border-border-default bg-bg-primary p-3 text-xs font-semibold text-text-primary scrollbar-soft">
        <code>{displayFetchSnippet}</code>
       </pre>
      </section>

      <p className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm font-bold text-primary">
       <code>mode: &quot;upsert&quot;</code> sẽ update khi có <code>artifactId</code>, còn không có
       thì tạo tệp mới.
      </p>
     </div>
    </DialogBody>

    <DialogFooter>
     <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      Đóng
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

function EditorPane(props: {
 artifact: HtmlArtifact | null;
 defaultFolderId: string | null;
 embedded?: boolean;
 folders: HtmlArtifactFolder[];
 htmlOnly?: boolean;
 isSaving: boolean;
 isDeleting: boolean;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onDelete: () => void;
}) {
 const { embedded = false, ...formProps } = props;

 return (
  <aside
   className={cn(
    "h-full min-h-0 bg-bg-subtle p-4",
    props.htmlOnly ? "overflow-hidden" : "overflow-y-auto scrollbar-soft",
    !embedded && "border-l-2 border-border-default",
   )}
  >
   <ArtifactForm {...formProps} />
  </aside>
 );
}

function ConfirmDeleteDialog({
 deleteDialog,
 isDeleting,
 onCancel,
 onConfirm,
 onOpenChange,
}: {
 deleteDialog: DeleteDialogState | null;
 isDeleting: boolean;
 onCancel: () => void;
 onConfirm: () => void;
 onOpenChange: (open: boolean) => void;
}) {
 const isFolder = deleteDialog?.kind === "folder";
 const title = isFolder ? "Xóa thư mục?" : "Xóa tệp HTML?";
 const name = isFolder ? deleteDialog.folder.name : deleteDialog?.artifact.title;
 const description = isFolder
  ? `Tệp trong "${name}" sẽ được chuyển về Chưa phân loại.`
  : `"${name ?? "Tệp này"}" sẽ bị xóa khỏi database.`;

 return (
  <Dialog open={Boolean(deleteDialog)} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
     <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
     <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>
      Hủy
     </Button>
     <Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Xóa
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

function CreateFolderDialog({
 folderDraft,
 folders,
 isOpen,
 isSaving,
 onFolderDraftChange,
 onOpenChange,
 onSubmit,
}: {
 folderDraft: { name: string; parentFolderId: string | null; color: HtmlArtifactFolderColor };
 folders: HtmlArtifactFolder[];
 isOpen: boolean;
 isSaving: boolean;
 onFolderDraftChange: (draft: {
  name: string;
  parentFolderId: string | null;
  color: HtmlArtifactFolderColor;
 }) => void;
 onOpenChange: (open: boolean) => void;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
 const parentFolder = folderDraft.parentFolderId
  ? folders.find((folder) => folder.id === folderDraft.parentFolderId)
  : null;

 return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-md">
    <form className="grid gap-4" onSubmit={onSubmit}>
     <DialogHeader>
      <DialogTitle>Thư mục mới</DialogTitle>
      <DialogDescription>
       {parentFolder
        ? `Tạo thư mục con trong "${parentFolder.name}".`
        : "Đặt tên và màu để gom tệp HTML theo nhóm."}
      </DialogDescription>
     </DialogHeader>

     <DialogBody>
      <label className="grid gap-1.5 text-sm font-bold text-text-primary">
       Tên thư mục
       <Input
        value={folderDraft.name}
        onChange={(event) =>
         onFolderDraftChange({
          ...folderDraft,
          name: event.target.value,
         })
        }
        placeholder="SC3 mock exams"
        required
        autoFocus
       />
      </label>

      <fieldset className="grid gap-2">
       <legend className="text-sm font-bold text-text-primary">Màu</legend>
       <div className="flex flex-wrap gap-2">
        {folderColorSequence.map((color) => {
         const selected = folderDraft.color === color;
         return (
          <button
           key={color}
           type="button"
           className={cn(
            "h-11 w-11 rounded-full border-2 shadow-theme-sm ring-offset-2 ring-offset-bg-card transition",
            folderColorSwatchClasses[color],
            selected ? "ring-2 ring-ring" : "opacity-80 hover:opacity-100",
           )}
           onClick={() =>
            onFolderDraftChange({
             ...folderDraft,
             color,
            })
           }
           aria-label={`Chọn màu ${color}`}
           aria-pressed={selected}
          />
         );
        })}
       </div>
      </fieldset>
     </DialogBody>

     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={isSaving}
       onClick={() => onOpenChange(false)}
      >
       Hủy
      </Button>
      <Button type="submit" disabled={isSaving || !folderDraft.name.trim()}>
       {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : (
        <FolderPlus className="h-4 w-4" />
       )}
       Tạo thư mục
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}

function ArtifactForm({
 artifact,
 defaultFolderId,
 folders,
 isSaving,
 isDeleting,
 onDraftChange,
 onSubmit,
 onDelete,
 htmlOnly = false,
}: {
 artifact: HtmlArtifact | null;
 defaultFolderId: string | null;
 folders: HtmlArtifactFolder[];
 isSaving: boolean;
 isDeleting: boolean;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onDelete: () => void;
 htmlOnly?: boolean;
}) {
 const [form, setForm] = useState<ArtifactFormState>(() =>
  toArtifactFormState(artifact, defaultFolderId),
 );
 const [isFormattingHtml, setIsFormattingHtml] = useState(false);
 const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("idle");
 const latestFormRef = useRef(form);

 const updateForm = (updater: (current: ArtifactFormState) => ArtifactFormState) => {
  const next = updater(latestFormRef.current);
  setSaveStatus(
   getArtifactFormSaveKey(next) ===
    getArtifactFormSaveKey(toArtifactFormState(artifact, defaultFolderId))
    ? "idle"
    : "dirty",
  );
  latestFormRef.current = next;
  setForm(next);
  onDraftChange(next);
 };

 useEffect(() => {
  latestFormRef.current = form;
 }, [form]);

 const submitForm = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi lưu.");
   return;
  }
  void Promise.resolve(onSubmit(form))
   .then(() => {
    setSaveStatus("saved");
   })
   .catch(() => {
    setSaveStatus("error");
   });
 };

 const formatHtml = async () => {
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi format.");
   return;
  }

  setIsFormattingHtml(true);
  try {
   const formattedHtml = await formatHtmlSource(form.html);
   updateForm((current) => ({ ...current, html: formattedHtml }));
   toast.success("Đã format HTML");
  } catch {
   toast.error("Không format được HTML. Kiểm tra lại cú pháp file.");
  } finally {
   setIsFormattingHtml(false);
  }
 };

 return (
  <form
   className={cn(
    "flex min-h-full flex-col rounded-xl border-2 border-border-default bg-bg-card shadow-theme-lg",
    htmlOnly ? "h-full gap-3 overflow-hidden p-3" : "gap-4 p-4",
   )}
   onSubmit={submitForm}
  >
   <div className="flex items-center justify-between gap-2">
    <div className="min-w-0">
     <h2 className="truncate font-black text-text-primary">
      {htmlOnly ? "Chỉnh HTML" : artifact ? "Sửa tệp" : "Tạo tệp"}
     </h2>
     {htmlOnly ? (
      <p
       className={cn(
        "text-xs font-bold",
        saveStatus === "error" ? "text-danger" : "text-text-muted",
       )}
      >
       {getDraftSaveLabel(saveStatus, Boolean(artifact))}
      </p>
     ) : null}
    </div>
    <div className="flex gap-2">
     {artifact && !htmlOnly && (
      <Button
       type="button"
       variant="destructive"
       size="sm"
       disabled={isDeleting || isSaving}
       onClick={onDelete}
      >
       <Trash2 className="h-4 w-4" />
       Xóa
      </Button>
     )}
     {htmlOnly ? (
      <Button
       type="button"
       variant="outline"
       size="sm"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
       ) : (
        <Code2 className="h-3.5 w-3.5" />
       )}
       Định dạng
      </Button>
     ) : null}
     <Button type="submit" size="sm" disabled={isSaving || isDeleting}>
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Lưu DB
     </Button>
    </div>
   </div>

   {!htmlOnly ? (
    <>
     <label className="grid gap-1.5 text-sm font-bold text-text-primary">
      Tiêu đề
      <Input
       value={form.title}
       onChange={(event) => updateForm((current) => ({ ...current, title: event.target.value }))}
       aria-label="Tiêu đề tệp HTML"
       placeholder="SC3 Mock Exam 03"
       required
      />
     </label>

     <div className="grid gap-1.5 text-sm font-bold text-text-primary">
      <span>Thư mục</span>
      <Select
       value={form.folderId ?? noFolderValue}
       onValueChange={(value) =>
        updateForm((current) => ({
         ...current,
         folderId: value === noFolderValue ? null : value,
        }))
       }
      >
       <SelectTrigger
        aria-label="Chọn thư mục cho tệp HTML"
        className="h-10 w-full rounded-xl border-border-default bg-bg-primary px-3 text-sm font-bold text-text-primary shadow-none"
       >
        <SelectValue placeholder="Chọn thư mục" />
       </SelectTrigger>
       <SelectContent align="start">
        <SelectGroup>
         <SelectItem value={noFolderValue}>Chưa phân loại</SelectItem>
         {folders.map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
           {folder.name}
          </SelectItem>
         ))}
        </SelectGroup>
       </SelectContent>
      </Select>
     </div>

     <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[150px_minmax(0,1fr)]">
      <div className="grid gap-1.5 text-sm font-bold text-text-primary">
       <span>Loại tệp</span>
       <Select
        value={form.artifactType}
        onValueChange={(value) =>
         updateForm((current) => ({
          ...current,
          artifactType: value as HtmlArtifactType,
         }))
        }
       >
        <SelectTrigger
         aria-label="Chọn loại tệp HTML"
         className="h-10 w-full rounded-xl border-border-default bg-bg-primary px-3 text-sm font-bold text-text-primary shadow-none"
        >
         <SelectValue placeholder="Chọn loại" />
        </SelectTrigger>
        <SelectContent align="start">
         <SelectGroup>
          {artifactTypes.map((type) => (
           <SelectItem key={type} value={type}>
            {artifactTypeLabels[type]}
           </SelectItem>
          ))}
         </SelectGroup>
        </SelectContent>
       </Select>
      </div>

      <label className="grid gap-1.5 text-sm font-bold text-text-primary">
       Tag
       <Input
        value={form.tagsInput}
        onChange={(event) =>
         updateForm((current) => ({ ...current, tagsInput: event.target.value }))
        }
        aria-label="Tag của tệp HTML"
        placeholder="SC3, mock, bổ ngữ"
       />
      </label>
     </div>
    </>
   ) : null}

   <div className="flex min-h-0 flex-1 flex-col gap-1.5">
    {!htmlOnly ? (
     <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
       <span id="html-source-label" className="text-sm font-bold text-text-primary">
        HTML
       </span>
       <p
        className={cn(
         "text-xs font-bold",
         saveStatus === "error" ? "text-danger" : "text-text-muted",
        )}
       >
        {getDraftSaveLabel(saveStatus, Boolean(artifact))}
       </p>
      </div>
      <Button
       type="button"
       variant="outline"
       size="sm"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
       ) : (
        <Code2 className="h-3.5 w-3.5" />
       )}
       Định dạng
      </Button>
     </div>
    ) : (
     <span id="html-source-label" className="sr-only">
      HTML
     </span>
    )}
    <HtmlSourceEditor
     ariaLabelledBy="html-source-label"
     fullHeight={htmlOnly}
     value={form.html}
     onChange={(htmlValue) => updateForm((current) => ({ ...current, html: htmlValue }))}
    />
   </div>
  </form>
 );
}

function HtmlSourceEditor({
 ariaLabelledBy,
 fullHeight = false,
 value,
 onChange,
}: {
 ariaLabelledBy: string;
 fullHeight?: boolean;
 value: string;
 onChange: (value: string) => void;
}) {
 return (
  <div
   className={cn(
    "html-source-editor overflow-hidden rounded-2xl border border-border-default bg-bg-primary shadow-inner focus-within:ring-2 focus-within:ring-ring [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full",
    fullHeight ? "min-h-0 flex-1" : "h-[clamp(18rem,48dvh,34rem)]",
   )}
  >
   <CodeMirror
    aria-labelledby={ariaLabelledBy}
    value={value}
    height="100%"
    basicSetup={{
     autocompletion: true,
     bracketMatching: true,
     closeBrackets: true,
     foldGutter: true,
     highlightActiveLine: true,
     highlightActiveLineGutter: true,
     lineNumbers: true,
    }}
    extensions={htmlEditorExtensions}
    placeholder="Paste nguyên file HTML vào đây..."
    theme="light"
    onChange={onChange}
   />
  </div>
 );
}

function ArtifactListButton({
 artifact,
 active,
 onCopyLink,
 onDelete,
 onDragEnd,
 onDragStart,
 onEdit,
 onClick,
}: {
 artifact: HtmlArtifactSummary;
 active: boolean;
 onCopyLink: () => void;
 onDelete: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onEdit: () => void;
 onClick: () => void;
}) {
 const isCoarsePointer = useCoarsePointer();
 const stopAction = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
  event.stopPropagation();
  action();
 };
 const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onClick();
 };

 return (
  <div
   role="button"
   tabIndex={0}
   draggable={!isCoarsePointer}
   onDragStart={() => onDragStart({ type: "artifact", id: artifact.id })}
   onDragEnd={onDragEnd}
   onClick={onClick}
   onKeyDown={handleKeyDown}
   className={cn(
    "group relative grid  gap-2 rounded-2xl border p-3.5 text-left shadow-theme-sm transition-colors",
    active
     ? "app-active-item"
     : "border-border-default bg-bg-card text-text-primary hover:border-primary/30 hover:bg-bg-elevated",
   )}
  >
   <div className="flex min-w-0 items-start justify-between gap-3">
    <div className="grid min-w-0 gap-1">
     <span className="truncate text-sm font-black text-text-primary">{artifact.title}</span>
     <p className="text-xs font-black text-text-muted">{formatDate(artifact.updatedAt)}</p>
    </div>
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
     <ArtifactCardAction icon={ExternalLink} label="Mở tệp" onClick={stopAction(onClick)} />
     <ArtifactCardAction icon={FileCode2} label="Chỉnh HTML" onClick={stopAction(onEdit)} />
     <ArtifactCardAction icon={Copy} label="Copy link" onClick={stopAction(onCopyLink)} />
     <ArtifactCardAction danger icon={Trash2} label="Xóa tệp" onClick={stopAction(onDelete)} />
    </div>
   </div>
   <div className="flex flex-wrap gap-1.5">
    <span className="rounded-full border border-border-default bg-bg-subtle px-2 py-0.5 text-[0.68rem] font-black text-text-muted">
     {artifactTypeLabels[artifact.artifactType]}
    </span>
    {artifact.tags.slice(0, 3).map((tag) => (
     <span
      key={`${artifact.id}-${tag}`}
      className="rounded-full border border-border-default bg-bg-subtle px-2 py-0.5 text-[0.68rem] font-black text-text-muted"
     >
      {tag}
     </span>
    ))}
    {artifact.tags.length > 3 ? (
     <span className="rounded-full border border-border-default bg-bg-subtle px-2 py-0.5 text-[0.68rem] font-black text-text-muted">
      +{artifact.tags.length - 3}
     </span>
    ) : null}
   </div>
  </div>
 );
}

function ArtifactCardAction({
 danger = false,
 icon: Icon,
 label,
 onClick,
}: {
 danger?: boolean;
 icon: typeof ExternalLink;
 label: string;
 onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
 return (
  <button
   type="button"
   aria-label={label}
   title={label}
   className={cn(
    "flex h-8 w-8 items-center justify-center rounded-lg border bg-bg-card text-text-muted shadow-theme-sm transition-colors hover:border-primary/30 hover:text-primary",
    danger && "hover:border-danger/30 hover:bg-danger-subtle hover:text-danger",
   )}
   onClick={onClick}
  >
   <Icon className="h-3.5 w-3.5" />
  </button>
 );
}
