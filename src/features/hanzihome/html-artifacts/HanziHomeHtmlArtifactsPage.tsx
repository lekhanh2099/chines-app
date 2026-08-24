"use client";

import { Label } from "@/components/ui/label";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import type { JsonFieldValue } from "@/types/json";
import type {
 ComponentProps,
 CSSProperties,
 DragEvent,
 FormEvent,
 KeyboardEvent,
 MouseEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
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
 PanelRightClose,
 PanelRightOpen,
 Pencil,
 PlugZap,
 Plus,
 Save,
 Search,
 Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
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
import { focusWithinRingClassName } from "@/components/ui/focus-ring";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
 usePanelRef,
} from "@/components/ui/resizable";
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
import { appShellStore } from "@/stores/app-shell-store";
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
import {
 htmlArtifactFolderSchema,
 htmlArtifactSummarySchema,
 htmlArtifactTypeSchema,
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
 blue: "bg-info-subtle text-info-text border-info/20",
 purple: "bg-purple-subtle text-purple-text border-purple/20",
 green: "bg-success-subtle text-success-text border-success/20",
 orange: "bg-warning-subtle text-warning-text border-warning/20",
 rose: "bg-danger-subtle text-danger-text border-danger/20",
 slate: "bg-bg-subtle text-text-secondary border-border-default",
};

type FolderColorSwatchStyle = {
 backgroundColor: CSSProperties["backgroundColor"];
 borderColor: CSSProperties["borderColor"];
};

const folderColorSwatchStyles: Record<HtmlArtifactFolderColor, FolderColorSwatchStyle> = {
 blue: { backgroundColor: "var(--color-info)", borderColor: "var(--color-info)" },
 purple: { backgroundColor: "var(--color-purple)", borderColor: "var(--color-purple)" },
 green: { backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" },
 orange: { backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" },
 rose: { backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)" },
 slate: {
  backgroundColor: "var(--color-text-muted)",
  borderColor: "var(--color-border-default)",
 },
};

const folderColorSequence: HtmlArtifactFolderColor[] = [
 "blue",
 "purple",
 "green",
 "orange",
 "rose",
 "slate",
];

const artifactTypes = htmlArtifactTypeSchema.options;
const emptyArtifactSummaries: HtmlArtifactSummary[] = [];
const emptyArtifactFolders: HtmlArtifactFolder[] = [];
const emptyRuntimeState: HtmlArtifactRuntimeState = {};
const noFolderValue = "__none__";
const desktopLayout = {
 "html-artifacts-preview": 72,
 "html-artifacts-inspector": 28,
};
const htmlArtifactsInspectorCollapsedSize = "3.25rem";
const runtimeStateSaveDelayMs = 2000;
const htmlEditorExtensions = [html({ autoCloseTags: true, matchClosingTags: true })];
type ArtifactSaveOptions = {
 silent?: boolean;
};

type ArtifactSubmitHandler = (
 formState: ArtifactFormState,
 options?: ArtifactSaveOptions,
) => Promise<void>;

const NullableStringSchema = z.string().nullable();

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;
const PublishConnectionInfoSchema = z.object({
 sessionUserId: NullableStringSchema,
 publishTokenEnabled: z.boolean(),
 publishOwnerId: NullableStringSchema,
 serviceRoleEnabled: z.boolean(),
});

type DeleteDialogState = z.infer<
 z.ZodDiscriminatedUnion<
  [
   z.ZodObject<{
    kind: z.ZodLiteral<"artifact">;
    artifact: typeof htmlArtifactSummarySchema;
   }>,
   z.ZodObject<{
    kind: z.ZodLiteral<"folder">;
    folder: typeof htmlArtifactFolderSchema;
   }>,
  ],
  "kind"
 >
>;

type DragItem = z.infer<
 z.ZodDiscriminatedUnion<
  [
   z.ZodObject<{ type: z.ZodLiteral<"artifact">; id: z.ZodString }>,
   z.ZodObject<{ type: z.ZodLiteral<"folder">; id: z.ZodString }>,
  ],
  "type"
 >
>;

const MobilePaneSchema = z.enum(["files", "preview", "edit"]);
const InspectorTabSchema = z.enum([MobilePaneSchema.enum.files, "edit"]);
const PreviewModeSchema = z.enum(["iframe", "editor"]);
const MoveDirectionSchema = z.enum(["up", "down"]);
const RouteHistoryModeSchema = z.enum(["push", "replace"]);
type MobilePane = z.infer<typeof MobilePaneSchema>;
type InspectorTab = z.infer<typeof InspectorTabSchema>;
type PreviewMode = z.infer<typeof PreviewModeSchema>;

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
 const [previewMode, setPreviewMode] = useState<PreviewMode>(PreviewModeSchema.enum.iframe);
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

function useHtmlArtifactsDesktopShell() {
 const [isDesktopShell, setIsDesktopShell] = useState(false);
 useEffect(() => {
  const query = window.matchMedia("(min-width: 1280px)");
  const updateShell = () => setIsDesktopShell(query.matches);
  updateShell();
  query.addEventListener("change", updateShell);
  return () => query.removeEventListener("change", updateShell);
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
 dragItem: Nullable<DragItem>;
 isLoading: boolean;
 error: ReturnType<typeof useHtmlArtifactSummariesQuery>["error"];
 searchQuery: string;
 selectedId: Nullable<string>;
 isFolderMutating: boolean;
 onCreateArtifact: () => void;
 onCreateFolder: () => void;
 onCopyArtifactLink: (artifactId: string) => void;
 onDeleteArtifact: (artifact: HtmlArtifactSummary) => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: Nullable<string>) => void;
 onEditArtifact: (artifactId: string) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 onReorderFolder: (folderId: string, direction: z.infer<typeof MoveDirectionSchema>) => void;
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
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
      Thư mục
     </Typography>
     <StudyInstructionText variant="caption" tone="muted" weight="black">
      {folders.length}
     </StudyInstructionText>
    </div>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="shrink-0"
     disabled={isFolderMutating}
     onClick={onCreateFolder}
    >
     <FolderPlus data-icon="inline-start" />
     Thư mục mới
    </Button>
   </div>
   <div className="grid shrink-0 border-b border-border-default bg-bg-card p-3">
    <div className="relative">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <Input
      value={searchQuery}
      onChange={(event) => onSearchChange(event.target.value)}
      aria-label="Tìm tệp HTML"
      placeholder="Tìm tệp"
      adornment="start"
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
      size="toolbar"
      align="start"
      disabled={isFolderMutating}
      onClick={onDeleteActiveFolder}
     >
      <Trash2 data-icon="inline-start" />
      Xóa thư mục
     </Button>
    ) : null}
   </div>
   <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-subtle px-4">
    <div className="flex min-w-0 items-center gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Tệp
     </Typography>
     <StudyInstructionText variant="caption" tone="muted" weight="black">
      {filteredArtifacts.length}
     </StudyInstructionText>
    </div>
    <Button type="button" size="toolbar" onClick={onCreateArtifact}>
     <Plus data-icon="inline-start" />
     Tệp mới
    </Button>
   </div>
   <div className="min-h-0 flex-1 overflow-y-auto bg-bg-subtle px-3 pb-4 pt-2 scrollbar-soft">
    {isLoading && <ArtifactDirectorySkeleton />}
    {Boolean(error) && (
     <StudyInstructionText role="alert" variant="label" tone="danger" weight="bold">
      Không tải được tệp HTML.
     </StudyInstructionText>
    )}
    {!isLoading && !error && filteredArtifacts.length === 0 && (
     <StudyInstructionText variant="label" tone="muted" weight="bold">
      Thư mục này chưa có tệp.
     </StudyInstructionText>
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
 dragItem: Nullable<DragItem>;
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
   <Button
    type="button"
    variant="ghost"
    align="start"
    className="flex min-w-0 flex-1"
    onClick={onClick}
   >
    <span
     className={cn(
      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
      folderColorClasses[color],
     )}
    >
     <Folder className="h-3.5 w-3.5" />
    </span>
    <StudyInstructionText as="span" clamp="one" className="min-w-0 flex-1">
     {name}
    </StudyInstructionText>
    <StudyInstructionText tone="muted" variant="caption" scale="relativeSmall">
     {count}
    </StudyInstructionText>
   </Button>
   {folderId ? (
    <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
     <Button
      type="button"
      variant="ghost"
      size="compact"
      className="flex w-7"
      aria-label={`Đưa ${name} lên`}
      disabled={!canMoveUp}
      onClick={(event) => {
       event.stopPropagation();
       onMoveUp?.();
      }}
     >
      <ArrowUp />
     </Button>
     <Button
      type="button"
      variant="ghost"
      size="compact"
      className="flex w-7"
      aria-label={`Đưa ${name} xuống`}
      disabled={!canMoveDown}
      onClick={(event) => {
       event.stopPropagation();
       onMoveDown?.();
      }}
     >
      <ArrowDown />
     </Button>
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
 dragItem: Nullable<DragItem>;
 folder: FolderTreeNode;
 siblings: HtmlArtifactFolder[];
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: Nullable<string>) => void;
 onReorderFolder: (folderId: string, direction: z.infer<typeof MoveDirectionSchema>) => void;
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
 onMinimizeInspector,
 onToggleFocus,
}: {
 defaultFolderId: Nullable<string>;
 editorArtifact: Nullable<HtmlArtifact>;
 folders: HtmlArtifactFolder[];
 isFocused: boolean;
 isDeleting: boolean;
 isSaving: boolean;
 mode: PreviewMode;
 selectedArtifact: Nullable<HtmlArtifact>;
 selectedSummary: Nullable<HtmlArtifactSummary>;
 runtimeState: HtmlArtifactRuntimeState;
 isFetching: boolean;
 onDelete: () => void;
 onDraftChange: (formState: ArtifactFormState) => void;
 onModeChange: (mode: PreviewMode) => void;
 onRuntimeStateChange: (artifactId: string, state: HtmlArtifactRuntimeState) => void;
 onSubmit: ArtifactSubmitHandler;
 onMinimizeInspector?: () => void;
 onToggleFocus: () => void;
}) {
 const iframeRef = useRef<HTMLIFrameElement>(null);
 const iframeSrcDoc =
  selectedArtifact && !isFetching
   ? injectRuntimeStateBridge(selectedArtifact.html, selectedArtifact.id, runtimeState)
   : "";
 useEffect(() => {
  const handleMessage = (event: MessageEvent<JsonFieldValue>) => {
   if (event.source !== iframeRef.current?.contentWindow) return;
   if (!isRuntimeStateMessage(event.data)) return;
   onRuntimeStateChange(event.data.artifactId, event.data.state);
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
 }, [onRuntimeStateChange]);
 return (
  <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-x border-border-default bg-bg-card">
   <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-bg-card px-4">
    <div className="min-w-0">
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black" clamp="one">
      {getArtifactTitle(selectedArtifact ?? selectedSummary)}
     </Typography>
     <StudyInstructionText variant="bodySmall" tone="muted" weight="medium" clamp="one">
      {selectedArtifact?.updatedAt
       ? `Cập nhật ${formatDate(selectedArtifact.updatedAt)}`
       : "Xem trước"}
     </StudyInstructionText>
    </div>
    <div className="flex shrink-0 items-center gap-2">
     <SegmentedControl
      value={mode}
      items={[
       { key: "iframe", label: "iframe", icon: Code2 },
       { key: "editor", label: "Chỉnh HTML", icon: FileCode2 },
      ]}
      onChange={onModeChange}
      aria-label="Chọn chế độ xem HTML"
     />
     <Button type="button" variant="outline" size="toolbar" onClick={onToggleFocus}>
      {isFocused ? <Minimize2 /> : <Maximize2 />}
      {isFocused ? "Thu nhỏ" : "Phóng to"}
     </Button>
     {onMinimizeInspector ? (
      <Button
       type="button"
       variant="surfaceCard"
       size="icon-toolbar"
       aria-label="Thu gọn thanh tệp"
       title="Thu gọn thanh tệp"
       onClick={onMinimizeInspector}
      >
       <PanelRightClose />
      </Button>
     ) : null}
    </div>
   </div>
   <div
    className={cn(
     "min-h-0 flex-1",
     mode === "editor" ? "overflow-hidden" : "overflow-auto bg-surface",
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
     <div className="flex h-full items-center justify-center p-6 text-center">
      <StudyInstructionText tone="muted" weight="bold">
       Chọn một tệp đã lưu hoặc dán HTML rồi bấm Lưu.
      </StudyInstructionText>
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
   <div className="h-8 w-full max-w-64 rounded-lg bg-bg-subtle" />
   <div className="h-4 w-full max-w-96 rounded-md bg-bg-subtle" />
   <div className="grid gap-3 sm:grid-cols-2">
    <div className="h-40 rounded-xl bg-bg-subtle" />
    <div className="h-40 rounded-xl bg-bg-subtle" />
   </div>
   <div className="h-56 rounded-xl bg-bg-subtle" />
   <span className="sr-only">Đang tải bản xem trước HTML</span>
  </div>
 );
}
function getHtmlArtifactFrameKey(artifactId: string, html: string) {
 let hash = 0;
 for (let index = 0; index < html.length; index += 1)
  hash = (hash * 31 + html.charCodeAt(index)) >>> 0;
 return `${artifactId}-${html.length}-${hash.toString(36)}`;
}
function StableHtmlArtifactIframe({
 artifact,
 initialSrcDoc,
 iframeRef,
}: {
 artifact: HtmlArtifact;
 initialSrcDoc: string;
 iframeRef: ComponentProps<"iframe">["ref"];
}) {
 const [frameSrc] = useState(() =>
  URL.createObjectURL(new Blob([initialSrcDoc], { type: "text/html;charset=utf-8" })),
 );
 useEffect(() => () => URL.revokeObjectURL(frameSrc), [frameSrc]);
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
function parsePublishConnectionInfo(
 value: JsonFieldValue,
): z.infer<z.ZodNullable<typeof PublishConnectionInfoSchema>> {
 const parsed = PublishConnectionInfoSchema.safeParse(value);
 return parsed.success ? parsed.data : null;
}
function KeyValueRow({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid gap-1 rounded-lg border border-border-default bg-bg-subtle px-3 py-2">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    transform="uppercase"
    scale="relativeSmall"
   >
    {label}
   </StudyInstructionText>
   <StudyInstructionText variant="code" tone="default" weight="bold" wrapping="breakAll">
    {value}
   </StudyInstructionText>
  </div>
 );
}

function PublishConnectionDialog({
 selectedArtifact,
 isOpen,
 onOpenChange,
}: {
 selectedArtifact: Nullable<HtmlArtifact>;
 isOpen: boolean;
 onOpenChange: (open: boolean) => void;
}) {
 const endpointPath = "/api/hanzihome/html-artifacts/publish";
 const displayEndpoint = `https://your-domain.com${endpointPath}`;
 const supabase = useMemo(() => createBrowserSupabaseClient(), []);
 const [connectionInfo, setConnectionInfo] =
  useState<z.infer<z.ZodNullable<typeof PublishConnectionInfoSchema>>>(null);
 const [sessionAccessToken, setSessionAccessToken] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [isLoadingConnection, setIsLoadingConnection] = useState(false);
 const exampleArtifactId = selectedArtifact?.id ?? "optional-stable-uuid";
 const exampleTitle = selectedArtifact?.title ?? "SC3 Mock Exam 04";
 const exampleType = selectedArtifact?.artifactType ?? "practice_page";
 const exampleTags = selectedArtifact?.tags.length ? selectedArtifact.tags : ["SC3", "mock"];
 const exampleHtml = selectedArtifact?.html
  ? selectedArtifact.html.slice(0, 96).trim()
  : '<!doctype html><html lang="vi"><head><meta charset="utf-8" /></head><body>...</body></html>';
 const buildFetchSnippet = (endpoint: string) =>
  `await fetch("${endpoint}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer <supabase-user-access-token-or-publish-token>"\n  },\n  body: JSON.stringify({\n    mode: "upsert",\n    artifactId: "${exampleArtifactId}",\n    title: ${JSON.stringify(exampleTitle)},\n    artifactType: "${exampleType}",\n    tags: ${JSON.stringify(exampleTags)},\n    folderId: null,\n    html: ${JSON.stringify(exampleHtml)}\n  })\n});`;
 const displayFetchSnippet = buildFetchSnippet(displayEndpoint);
 const getCurrentEndpoint = () =>
  typeof window === "undefined"
   ? displayEndpoint
   : new URL(endpointPath, window.location.origin).toString();
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
     fetch(endpointPath, { method: "GET", headers: { Accept: "application/json" } }),
     supabase.auth.getSession(),
    ]);
    const statusJson: JsonFieldValue = await statusResponse.json().catch(() => null);
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
   <DialogContent size="lg">
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
       <StudyInstructionText variant="overline" tone="muted" weight="black" transform="uppercase">
        Endpoint
       </StudyInstructionText>
       <StudyInstructionText variant="code" tone="default" weight="bold" wrapping="breakAll">
        {endpointPath}
       </StudyInstructionText>
       <Button
        type="button"
        variant="outline"
        size="toolbar"
        onClick={() => void copyText(getCurrentEndpoint(), "Đã copy endpoint")}
       >
        <Copy data-icon="inline-start" />
        Copy
       </Button>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
       <KeyValueRow label="Owner" value={connectionInfo?.sessionUserId ?? "Đang đọc..."} />
       <KeyValueRow label="Token" value={isLoadingConnection ? "Đang đọc..." : tokenPreview} />
      </div>
      <section className="grid gap-2">
       <StudyInstructionText variant="label" tone="default" weight="black">
        Ví dụ fetch
       </StudyInstructionText>
       <pre className="max-h-80 overflow-auto rounded-xl border border-border-default bg-bg-primary p-3 text-xs font-semibold text-text-primary scrollbar-soft">
        <code>{displayFetchSnippet}</code>
       </pre>
      </section>
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
 artifact: Nullable<HtmlArtifact>;
 defaultFolderId: Nullable<string>;
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
    !embedded && "border-l border-border-default",
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
 deleteDialog: Nullable<DeleteDialogState>;
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
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
     <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
     <Button type="button" variant="outline" disabled={isDeleting} onClick={onCancel}>
      Hủy
     </Button>
     <Button type="button" variant="destructive" disabled={isDeleting} onClick={onConfirm}>
      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}Xóa
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
 folderDraft: { name: string; parentFolderId: Nullable<string>; color: HtmlArtifactFolderColor };
 folders: HtmlArtifactFolder[];
 isOpen: boolean;
 isSaving: boolean;
 onFolderDraftChange: (draft: {
  name: string;
  parentFolderId: Nullable<string>;
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
   <DialogContent size="sm">
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
      <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
       Tên thư mục
       <Input
        value={folderDraft.name}
        onChange={(event) => onFolderDraftChange({ ...folderDraft, name: event.target.value })}
        placeholder="SC3 mock exams"
        required
        autoFocus
       />
      </Label>
      <fieldset className="grid gap-2">
       <legend className="text-sm font-bold text-text-primary">Màu</legend>
       <div className="flex flex-wrap gap-2">
        {folderColorSequence.map((color) => (
         <Button
          key={color}
          type="button"
          variant="swatch"
          size="icon"
          aria-pressed={folderDraft.color === color}
          style={folderColorSwatchStyles[color]}
          onClick={() => onFolderDraftChange({ ...folderDraft, color })}
          aria-label={`Chọn màu ${color}`}
         />
        ))}
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
       {isSaving ? <Loader2 className="animate-spin" /> : <FolderPlus />}Tạo thư mục
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
 artifact: Nullable<HtmlArtifact>;
 defaultFolderId: Nullable<string>;
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
   .then(() => setSaveStatus("saved"))
   .catch(() => setSaveStatus("error"));
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
    "flex min-h-full flex-col rounded-xl border border-border-default bg-bg-card",
    htmlOnly ? "h-full gap-3 overflow-hidden p-3" : "gap-4 p-4",
   )}
   onSubmit={submitForm}
  >
   <div className="flex items-center justify-between gap-2">
    <div className="min-w-0 flex-1">
     {htmlOnly ? (
      <Input
       value={form.title}
       onChange={(event) => updateForm((current) => ({ ...current, title: event.target.value }))}
       aria-label="Tiêu đề tệp HTML"
       placeholder="Tên tệp HTML"
       required
      />
     ) : (
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black" clamp="one">
       {artifact ? "Sửa tệp" : "Tạo tệp"}
      </Typography>
     )}
     {htmlOnly ? (
      <StudyInstructionText
       variant="caption"
       tone={saveStatus === "error" ? "dangerStrong" : "muted"}
       weight="bold"
      >
       {getDraftSaveLabel(saveStatus, Boolean(artifact))}
      </StudyInstructionText>
     ) : null}
    </div>
    <div className="flex gap-2">
     {artifact && !htmlOnly ? (
      <Button
       type="button"
       variant="destructive"
       size="toolbar"
       disabled={isDeleting || isSaving}
       onClick={onDelete}
      >
       <Trash2 />
       Xóa
      </Button>
     ) : null}
     {htmlOnly ? (
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? <Loader2 className="animate-spin" /> : <Code2 />}Định dạng
      </Button>
     ) : null}
     <Button type="submit" size="toolbar" disabled={isSaving || isDeleting}>
      {isSaving ? <Loader2 className="animate-spin" /> : <Save />}Lưu DB
     </Button>
    </div>
   </div>
   {!htmlOnly ? (
    <>
     <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
      Tiêu đề
      <Input
       value={form.title}
       onChange={(event) => updateForm((current) => ({ ...current, title: event.target.value }))}
       aria-label="Tiêu đề tệp HTML"
       placeholder="SC3 Mock Exam 03"
       required
      />
     </Label>
     <div className="grid gap-1.5">
      <Typography as="span" variant="label" weight="bold">
       Thư mục
      </Typography>
      <Select
       value={form.folderId ?? noFolderValue}
       onValueChange={(value) =>
        updateForm((current) => ({ ...current, folderId: value === noFolderValue ? null : value }))
       }
      >
       <SelectTrigger width="full" aria-label="Chọn thư mục cho tệp HTML">
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
      <div className="grid gap-1.5">
       <Typography as="span" variant="label" weight="bold">
        Loại tệp
       </Typography>
       <Select
        value={form.artifactType}
        onValueChange={(value) => {
         const parsedArtifactType = htmlArtifactTypeSchema.safeParse(value);
         if (!parsedArtifactType.success) return;
         updateForm((current) => ({ ...current, artifactType: parsedArtifactType.data }));
        }}
       >
        <SelectTrigger width="full" aria-label="Chọn loại tệp HTML">
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
      <Label variant="label" tone="default" weight="bold" className="grid gap-1.5">
       Tag
       <Input
        value={form.tagsInput}
        onChange={(event) =>
         updateForm((current) => ({ ...current, tagsInput: event.target.value }))
        }
        aria-label="Tag của tệp HTML"
        placeholder="SC3, mock, bổ ngữ"
       />
      </Label>
     </div>
    </>
   ) : null}
   <div className="flex min-h-0 flex-1 flex-col gap-1.5">
    {!htmlOnly ? (
     <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
       <StudyInstructionText id="html-source-label" variant="label" tone="default" weight="bold">
        HTML
       </StudyInstructionText>
       <StudyInstructionText
        variant="caption"
        tone={saveStatus === "error" ? "dangerStrong" : "muted"}
        weight="bold"
       >
        {getDraftSaveLabel(saveStatus, Boolean(artifact))}
       </StudyInstructionText>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={isSaving || isDeleting || isFormattingHtml || !form.html.trim()}
       onClick={formatHtml}
      >
       {isFormattingHtml ? <Loader2 className="animate-spin" /> : <Code2 />}Định dạng
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
    "html-source-editor overflow-hidden rounded-xl border border-border-default bg-bg-primary shadow-inner [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full",
    focusWithinRingClassName,
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
    "group relative grid gap-2 rounded-xl border p-3.5 text-left shadow-theme-sm transition-colors",
    active
     ? "app-active-item"
     : "border-border-default bg-bg-card text-text-primary hover:border-primary/30 hover:bg-bg-elevated",
   )}
  >
   <div className="flex min-w-0 items-start justify-between gap-3">
    <div className="grid min-w-0 gap-1">
     <StudyInstructionText variant="label" tone="default" weight="black" clamp="one">
      {artifact.title}
     </StudyInstructionText>
     <StudyInstructionText variant="caption" tone="muted" weight="black">
      {formatDate(artifact.updatedAt)}
     </StudyInstructionText>
    </div>
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
     <ArtifactCardAction icon={ExternalLink} label="Mở tệp" onClick={stopAction(onClick)} />
     <ArtifactCardAction icon={Pencil} label="Chỉnh thông tin" onClick={stopAction(onEdit)} />
     <ArtifactCardAction icon={Copy} label="Copy link" onClick={stopAction(onCopyLink)} />
     <ArtifactCardAction danger icon={Trash2} label="Xóa tệp" onClick={stopAction(onDelete)} />
    </div>
   </div>
   <div className="flex flex-wrap gap-1.5">
    <Badge size="sm">{artifactTypeLabels[artifact.artifactType]}</Badge>
    {artifact.tags.slice(0, 3).map((tag) => (
     <Badge key={`${artifact.id}-${tag}`} size="sm">
      {tag}
     </Badge>
    ))}
    {artifact.tags.length > 3 ? <Badge size="sm">+{artifact.tags.length - 3}</Badge> : null}
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
  <Button
   type="button"
   aria-label={label}
   title={label}
   variant={danger ? "destructive" : "outline"}
   size="icon-toolbar"
   onClick={onClick}
  >
   <Icon />
  </Button>
 );
}
