"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2, FileCode2, Folder, PanelRightOpen, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import { Typography } from "@/components/ui/typography";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
 usePanelRef,
} from "@/components/ui/resizable";
import { appShellStore } from "@/stores/app-shell-store";
import { getHtmlArtifactApiErrorMessage as getApiErrorMessage } from "./html-artifact-display-utils";
import {
 hasFolderDescendant,
 parseTags,
 type ArtifactFormState,
 type FolderFilter,
} from "./html-artifact-page-utils";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
 HtmlArtifactRuntimeState,
 HtmlArtifactSummary,
} from "./html-artifact.schema";
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
import {
 ConfirmDeleteDialog,
 CreateFolderDialog,
 PublishConnectionDialog,
 folderColorSequence,
 type DeleteDialogState,
} from "./components/HtmlArtifactDialogs";
import {
 EditorPane,
 type ArtifactSaveOptions,
 type ArtifactSubmitHandler,
 type Nullable,
} from "./components/HtmlArtifactEditor";
import { PreviewPane, type PreviewMode } from "./components/HtmlArtifactPreview";
import {
 DirectoryPane,
 useHtmlArtifactsDesktopShell,
 MoveDirectionSchema,
 type DragItem,
} from "./components/HtmlArtifactDirectory";

const emptyArtifactSummaries: HtmlArtifactSummary[] = [];
const emptyArtifactFolders: HtmlArtifactFolder[] = [];
const emptyRuntimeState: HtmlArtifactRuntimeState = {};
const desktopLayout = {
 "html-artifacts-preview": 72,
 "html-artifacts-inspector": 28,
};
const htmlArtifactsInspectorCollapsedSize = "3.25rem";
const runtimeStateSaveDelayMs = 2000;

const MobilePaneSchema = z.enum(["files", "preview", "edit"]);
const InspectorTabSchema = z.enum([MobilePaneSchema.enum.files, "edit"]);
const RouteHistoryModeSchema = z.enum(["push", "replace"]);
type MobilePane = z.infer<typeof MobilePaneSchema>;
type InspectorTab = z.infer<typeof InspectorTabSchema>;

export function HanziHomeHtmlArtifactsPage() {
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const artifactsQuery = useHtmlArtifactSummariesQuery();
 const selectedIdFromUrl = searchParams.get("artifactId");
 const selectedId: z.infer<z.ZodNullable<z.ZodString>> =
  selectedIdFromUrl === "new" ? "new" : selectedIdFromUrl;
 const [activeFolderId, setActiveFolderId] = useState<FolderFilter>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [mobilePane, setMobilePane] = useState<MobilePane>("preview");
 const [inspectorTab, setInspectorTab] = useState<InspectorTab>(InspectorTabSchema.enum.files);
 const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
 const [previewMode, setPreviewMode] = useState<PreviewMode>("iframe");
 const isPreviewFocused = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const { setContentFullscreen } = appShellStore.actions;
 const [draftPreview, setDraftPreview] = useState<
  Nullable<{
   targetId: string;
   form: ArtifactFormState;
  }>
 >(null);
 const isDesktopShell = useHtmlArtifactsDesktopShell();
 const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
 const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
 const [folderDraft, setFolderDraft] = useState<{
  name: string;
  parentFolderId: Nullable<string>;
  color: HtmlArtifactFolderColor;
 }>({
  name: "",
  parentFolderId: null,
  color: "blue",
 });
 const [deleteDialog, setDeleteDialog] = useState<Nullable<DeleteDialogState>>(null);
 const [dragItem, setDragItem] = useState<Nullable<DragItem>>(null);
 const createMutation = useCreateHtmlArtifactMutation();
 const updateMutation = useUpdateHtmlArtifactMutation();
 const deleteMutation = useDeleteHtmlArtifactMutation();
 const createFolderMutation = useCreateHtmlArtifactFolderMutation();
 const updateFolderMutation = useUpdateHtmlArtifactFolderMutation();
 const deleteFolderMutation = useDeleteHtmlArtifactFolderMutation();
 const updateRuntimeStateMutation = useUpdateHtmlArtifactRuntimeStateMutation();
 const inspectorPanelRef = usePanelRef();
 const runtimeStateSaveTimerRef = useRef<z.infer<z.ZodNullable<z.ZodNumber>>>(null);
 const latestRuntimeStateSaveRef = useRef<
  Nullable<{
   artifactId: string;
   state: HtmlArtifactRuntimeState;
  }>
 >(null);

 useEffect(() => {
  return () => setContentFullscreen(false);
 }, [setContentFullscreen]);

 useEffect(() => {
  if (!isPreviewFocused) return;

  const exitOnEscape = (event: globalThis.KeyboardEvent) => {
   if (event.key === "Escape") setContentFullscreen(false);
  };

  window.addEventListener("keydown", exitOnEscape);
  return () => window.removeEventListener("keydown", exitOnEscape);
 }, [isPreviewFocused, setContentFullscreen]);

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

 const syncInspectorMinimized = () => {
  const isCollapsed = inspectorPanelRef.current?.isCollapsed();
  if (isCollapsed === undefined) return;
  setIsInspectorMinimized((current) => (current === isCollapsed ? current : isCollapsed));
 };
 const minimizeInspector = () => {
  inspectorPanelRef.current?.collapse();
  syncInspectorMinimized();
 };
 const expandInspector = () => {
  inspectorPanelRef.current?.expand();
  syncInspectorMinimized();
 };

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

 const previewArtifact = useMemo<Nullable<HtmlArtifact>>(() => {
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
  artifactId: Nullable<string>,
  mode: z.infer<typeof RouteHistoryModeSchema> = RouteHistoryModeSchema.enum.push,
 ) => {
  const nextParams = new URLSearchParams(searchParams.toString());

  if (artifactId) nextParams.set("artifactId", artifactId);
  else nextParams.delete("artifactId");

  const queryString = nextParams.toString();
  const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

  if (mode === "replace") router.replace(nextUrl);
  else router.push(nextUrl);
 };

 const queueRuntimeStateSave = (artifactId: string, state: HtmlArtifactRuntimeState) => {
  if (!selectedArtifact || artifactId !== selectedArtifact.id) return;

  latestRuntimeStateSaveRef.current = { artifactId, state };
  if (runtimeStateSaveTimerRef.current) window.clearTimeout(runtimeStateSaveTimerRef.current);

  runtimeStateSaveTimerRef.current = window.setTimeout(() => {
   const payload = latestRuntimeStateSaveRef.current;
   if (!payload) return;

   void updateRuntimeStateMutation
    .mutateAsync({ artifactId: payload.artifactId, input: { state: payload.state } })
    .catch(() => toast.error("Không thể sync đáp án trong iframe lên DB"));
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

 const resetForNewArtifact = () => navigateToArtifact("new");

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

 const moveFolderByDirection = async (
  folderId: string,
  direction: z.infer<typeof MoveDirectionSchema>,
 ) => {
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
 const editArtifactDetails = (artifactId: string) => {
  navigateToArtifact(artifactId);
  setInspectorTab("edit");
  setMobilePane("edit");
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
   title: formState.title.trim() || "Tệp HTML mới",
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
   if (!options.silent) toast.error(getApiErrorMessage(error, "Không thể lưu tệp HTML"));
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
  onToggleFocus: () => setContentFullscreen(!isPreviewFocused),
  onMinimizeInspector:
   isDesktopShell && !isPreviewFocused && !isInspectorMinimized ? minimizeInspector : undefined,
 };

 return (
  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
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
        onEditArtifact={editArtifactDetails}
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
      collapsible
      collapsedSize={htmlArtifactsInspectorCollapsedSize}
      panelRef={inspectorPanelRef}
      onResize={syncInspectorMinimized}
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
       isMinimized={isInspectorMinimized}
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
       onExpand={expandInspector}
       onCopyArtifactLink={(artifactId) => void copyArtifactLink(artifactId)}
       onDeleteArtifact={requestDeleteArtifactSummary}
       onEditArtifact={editArtifactDetails}
       onDraftChange={updateDraftPreview}
       onSubmit={saveArtifact}
       onTabChange={setInspectorTab}
      />
     </ResizablePanel>
    </ResizablePanelGroup>
   ) : null}
  </div>
 );
}

function MobilePaneTabs({
 activePane,
 onChange,
}: {
 activePane: MobilePane;
 onChange: (pane: MobilePane) => void;
}) {
 const panes: SegmentedControlItem<MobilePane>[] = [
  { key: "files", label: "Tệp", icon: Folder },
  { key: "preview", label: "Xem trước", icon: Code2 },
  { key: "edit", label: "Sửa", icon: FileCode2 },
 ];
 return (
  <div className="shrink-0 border-b border-border-default bg-bg-card p-2">
   <SegmentedControl
    value={activePane}
    items={panes}
    onChange={onChange}
    density="touch"
    layout="wrap"
    aria-label="Chọn vùng tệp HTML"
   />
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
 isMinimized,
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
 onExpand,
 onDraftChange,
 onSubmit,
 onTabChange,
}: {
 activeFolderId: FolderFilter;
 activeTab: InspectorTab;
 artifact: Nullable<HtmlArtifact>;
 artifacts: HtmlArtifactSummary[];
 defaultFolderId: Nullable<string>;
 dragItem: Nullable<DragItem>;
 error: ReturnType<typeof useHtmlArtifactSummariesQuery>["error"];
 filteredArtifacts: HtmlArtifactSummary[];
 folders: HtmlArtifactFolder[];
 isDeleting: boolean;
 isFolderMutating: boolean;
 isMinimized: boolean;
 isLoading: boolean;
 isSaving: boolean;
 searchQuery: string;
 selectedId: Nullable<string>;
 onCreateArtifact: () => void;
 onCreateFolder: () => void;
 onCopyArtifactLink: (artifactId: string) => void;
 onDeleteArtifact: (artifact: HtmlArtifactSummary) => void;
 onDelete: () => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: Nullable<string>) => void;
 onEditArtifact: (artifactId: string) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 onReorderFolder: (folderId: string, direction: z.infer<typeof MoveDirectionSchema>) => void;
 onOpenPublishDialog: () => void;
 onExpand: () => void;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onTabChange: (tab: InspectorTab) => void;
}) {
 if (isMinimized) {
  return (
   <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border-default bg-bg-card">
    <div className="flex h-full items-center justify-center px-1.5 py-2">
     <Button
      type="button"
      variant="surfaceCard"
      size="icon-sm"
      aria-label="Mở rộng thanh tệp"
      title="Mở rộng thanh tệp"
      onClick={onExpand}
     >
      <PanelRightOpen className="size-4" />
     </Button>
    </div>
   </aside>
  );
 }

 return (
  <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border-default bg-bg-card">
   <div className="flex h-14 shrink-0 items-center border-b border-border-default bg-bg-card px-3">
    <div className="flex w-full items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-2">
      <Folder className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
      <Typography as="h2" variant="cardTitle" tone="default" weight="black" clamp="one">
       {activeTab === "files" ? "Tệp" : "Chỉnh tệp"}
      </Typography>
      {activeTab === "files" ? (
       <Typography as="span" variant="caption" tone="muted" weight="medium">
        {filteredArtifacts.length}
       </Typography>
      ) : null}
     </div>
     <div className="flex shrink-0 items-center gap-1">
      {activeTab === "edit" ? (
       <Button type="button" variant="ghost" size="toolbar" onClick={() => onTabChange("files")}>
        <Folder data-icon="inline-start" />
        Danh sách
       </Button>
      ) : null}
      <Button type="button" variant="outline" size="toolbar" onClick={onOpenPublishDialog}>
       <PlugZap data-icon="inline-start" />
       Kết nối
      </Button>
     </div>
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
