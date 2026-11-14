"use client";

import { useEffect, useMemo, useState } from "react";

import type { FolderFilter } from "./html-artifact-page-utils";
import type {
 HtmlArtifactFolder,
 HtmlArtifactRuntimeState,
 HtmlArtifactSummary,
} from "./html-artifact.schema";
import { filterHtmlArtifactSummaries, getConcreteFolderId } from "./html-artifacts-page-model";
import {
 useHtmlArtifactQuery,
 useHtmlArtifactRuntimeStateQuery,
 useHtmlArtifactSummariesQuery,
} from "./useHtmlArtifacts";
import { useHtmlArtifactDraftPreview } from "./useHtmlArtifactDraftPreview";
import { useHtmlArtifactSave } from "./useHtmlArtifactSave";
import { useHtmlArtifactRuntimeStateSave } from "./useHtmlArtifactRuntimeStateSave";
import { useHtmlArtifactsDeleteDialog } from "./useHtmlArtifactsDeleteDialog";
import { useHtmlArtifactsFolderActions } from "./useHtmlArtifactsFolderActions";
import { useHtmlArtifactsInspectorPanel } from "./useHtmlArtifactsInspectorPanel";
import { useHtmlArtifactsPreviewFocus } from "./useHtmlArtifactsPreviewFocus";
import { useHtmlArtifactsRoute } from "./useHtmlArtifactsRoute";
import {
 ConfirmDeleteDialog,
 CreateFolderDialog,
 PublishConnectionDialog,
} from "./components/HtmlArtifactDialogs";
import { EditorPane } from "./components/HtmlArtifactEditor";
import { PreviewPane, type PreviewMode } from "./components/HtmlArtifactPreview";
import { DirectoryPane, useHtmlArtifactsDesktopShell } from "./components/HtmlArtifactDirectory";
import {
 InspectorTabSchema,
 RightInspectorPane,
 type InspectorTab,
 type MobilePane,
} from "./components/HtmlArtifactInspectorPane";
import {
 HtmlArtifactsDesktopShell,
 HtmlArtifactsMobileShell,
} from "./components/HtmlArtifactsWorkspaceLayout";

const emptyArtifactSummaries: HtmlArtifactSummary[] = [];
const emptyArtifactFolders: HtmlArtifactFolder[] = [];
const emptyRuntimeState: HtmlArtifactRuntimeState = {};

export function HanziHomeHtmlArtifactsPage() {
 const { pathname, router, searchParams, selectedId, navigateToArtifact, copyArtifactLink } =
  useHtmlArtifactsRoute();
 const artifactsQuery = useHtmlArtifactSummariesQuery();
 const [activeFolderId, setActiveFolderId] = useState<FolderFilter>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [mobilePane, setMobilePane] = useState<MobilePane>("preview");
 const [inspectorTab, setInspectorTab] = useState<InspectorTab>(InspectorTabSchema.enum.files);
 const [previewMode, setPreviewMode] = useState<PreviewMode>("iframe");
 const { isPreviewFocused, setContentFullscreen } = useHtmlArtifactsPreviewFocus();
 const isDesktopShell = useHtmlArtifactsDesktopShell();
 const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
 const {
  expandInspector,
  inspectorPanelRef,
  isInspectorMinimized,
  minimizeInspector,
  syncInspectorMinimized,
 } = useHtmlArtifactsInspectorPanel();

 const artifacts = artifactsQuery.artifacts ?? emptyArtifactSummaries;
 const folders = artifactsQuery.folders ?? emptyArtifactFolders;
 const effectiveSelectedId = selectedId === "new" ? null : (selectedId ?? artifacts[0]?.id ?? null);
 const selectedArtifactQuery = useHtmlArtifactQuery(effectiveSelectedId);
 const selectedArtifact = selectedArtifactQuery.data ?? null;
 const runtimeStateQuery = useHtmlArtifactRuntimeStateQuery(selectedArtifact?.id ?? null);
 const queueRuntimeStateSave = useHtmlArtifactRuntimeStateSave(selectedArtifact);
 const { isSaving, saveArtifact, updateMutation } = useHtmlArtifactSave({
  selectedArtifact,
  onArtifactSaved: (artifactId) => navigateToArtifact(artifactId, "replace"),
  onShowSavedPreview: () => {
   setMobilePane("preview");
   setPreviewMode("iframe");
  },
 });
 const { previewArtifact, updateDraftPreview } = useHtmlArtifactDraftPreview(
  selectedArtifact,
  selectedId,
 );

 const selectedSummary = useMemo(
  () => artifacts.find((artifact) => artifact.id === effectiveSelectedId) ?? null,
  [artifacts, effectiveSelectedId],
 );
 const filteredArtifacts = useMemo(
  () => filterHtmlArtifactSummaries(artifacts, activeFolderId, searchQuery),
  [activeFolderId, artifacts, searchQuery],
 );
 const defaultFolderId = getConcreteFolderId(activeFolderId);

 useEffect(() => {
  if (selectedId || artifacts.length === 0) return;
  const firstArtifactId = artifacts[0]?.id;
  if (!firstArtifactId) return;
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("artifactId", firstArtifactId);
  router.replace(`${pathname}?${nextParams.toString()}`);
 }, [artifacts, pathname, router, searchParams, selectedId]);

 const {
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
 } = useHtmlArtifactsFolderActions({
  activeFolderId,
  artifacts,
  folders,
  updateMutation,
  onActiveFolderChange: setActiveFolderId,
 });
 const {
  confirmDelete,
  deleteDialog,
  deleteFolderMutation,
  deleteMutation,
  requestDeleteActiveFolder,
  requestDeleteArtifactSummary,
  requestDeleteSelectedArtifact,
  setDeleteDialog,
 } = useHtmlArtifactsDeleteDialog({
  activeFolderId,
  filteredArtifacts,
  folders,
  selectedArtifact,
  onActiveFolderChange: setActiveFolderId,
  onArtifactDeleted: (nextArtifactId) => navigateToArtifact(nextArtifactId, "replace"),
 });
 const isDeleting = deleteMutation.isPending;
 const isFolderMutating =
  createFolderMutation.isPending ||
  updateFolderMutation.isPending ||
  deleteFolderMutation.isPending;

 const resetForNewArtifact = () => navigateToArtifact("new");

 const editArtifactDetails = (artifactId: string) => {
  navigateToArtifact(artifactId);
  setInspectorTab("edit");
  setMobilePane("edit");
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

 const directoryPaneProps = {
  activeFolderId,
  artifacts,
  folders,
  filteredArtifacts,
  dragItem,
  isLoading: artifactsQuery.isLoading,
  error: artifactsQuery.error,
  searchQuery,
  selectedId: effectiveSelectedId,
  isFolderMutating,
  onCreateFolder: openCreateFolderDialog,
  onCopyArtifactLink: (artifactId: string) => void copyArtifactLink(artifactId),
  onDeleteArtifact: requestDeleteArtifactSummary,
  onEditArtifact: editArtifactDetails,
  onDeleteActiveFolder: requestDeleteActiveFolder,
  onDragEnd: () => setDragItem(null),
  onDragStart: setDragItem,
  onDropOnFolder: dropOnFolder,
  onSearchChange: setSearchQuery,
  onSelectFolder: setActiveFolderId,
  onReorderFolder: moveFolderByDirection,
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
    <HtmlArtifactsMobileShell
     activePane={mobilePane}
     onPaneChange={setMobilePane}
     filesPane={
      <DirectoryPane
       {...directoryPaneProps}
       onCreateArtifact={() => {
        resetForNewArtifact();
        setPreviewMode("editor");
        setMobilePane("preview");
       }}
       onSelectArtifact={(artifactId) => {
        navigateToArtifact(artifactId);
        setMobilePane("preview");
       }}
      />
     }
     previewPane={<PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />}
     editPane={
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
     }
    />
   ) : null}

   {isDesktopShell && isPreviewFocused ? (
    <div className="min-h-0 flex-1 overflow-hidden">
     <PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />
    </div>
   ) : null}

   {isDesktopShell && !isPreviewFocused ? (
    <HtmlArtifactsDesktopShell
     inspectorPanelRef={inspectorPanelRef}
     onInspectorResize={syncInspectorMinimized}
     previewPane={<PreviewPane {...previewPaneProps} isFocused={isPreviewFocused} />}
     inspectorPane={
      <RightInspectorPane
       {...directoryPaneProps}
       activeTab={inspectorTab}
       artifact={selectedArtifact}
       defaultFolderId={defaultFolderId}
       isDeleting={isDeleting}
       isMinimized={isInspectorMinimized}
       isSaving={isSaving}
       onCreateArtifact={() => {
        resetForNewArtifact();
        setPreviewMode("editor");
       }}
       onDelete={requestDeleteSelectedArtifact}
       onSelectArtifact={navigateToArtifact}
       onOpenPublishDialog={() => setIsPublishDialogOpen(true)}
       onExpand={expandInspector}
       onDraftChange={updateDraftPreview}
       onSubmit={saveArtifact}
       onTabChange={setInspectorTab}
      />
     }
    />
   ) : null}
  </div>
 );
}
