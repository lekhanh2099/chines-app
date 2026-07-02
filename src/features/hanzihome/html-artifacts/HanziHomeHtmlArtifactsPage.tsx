"use client";
import type { DragEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import {
 Code2,
 Copy,
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
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { HtmlArtifactsApiError } from "./html-artifact-api";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
 HtmlArtifactRuntimeState,
 HtmlArtifactSummary,
 HtmlArtifactType,
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

const artifactTypeLabels: Record<HtmlArtifactType, string> = {
 practice_page: "Trang luyện tập",
 mock_exam: "Đề thử",
 grammar_drill: "Luyện ngữ pháp",
 reference: "Tài liệu tham khảo",
 other: "Khác",
};

const folderColorClasses: Record<HtmlArtifactFolderColor, string> = {
 blue: "bg-blue-500/15 text-blue-700 ring-blue-500/20",
 purple: "bg-purple-500/15 text-purple-700 ring-purple-500/20",
 green: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
 orange: "bg-orange-500/15 text-orange-700 ring-orange-500/20",
 rose: "bg-rose-500/15 text-rose-700 ring-rose-500/20",
 slate: "bg-slate-500/15 text-slate-700 ring-slate-500/20",
};

const folderColorSwatchClasses: Record<HtmlArtifactFolderColor, string> = {
 blue: "border-blue-500 bg-blue-500",
 purple: "border-purple-500 bg-purple-500",
 green: "border-emerald-500 bg-emerald-500",
 orange: "border-orange-500 bg-orange-500",
 rose: "border-rose-500 bg-rose-500",
 slate: "border-slate-500 bg-slate-500",
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

type FolderFilter = "all" | "unfiled" | string;

type ArtifactFormState = {
 title: string;
 folderId: string | null;
 artifactType: HtmlArtifactType;
 tagsInput: string;
 html: string;
};

type ArtifactSaveOptions = {
 silent?: boolean;
};

type ArtifactSubmitHandler = (
 formState: ArtifactFormState,
 options?: ArtifactSaveOptions,
) => Promise<void> | void;

type AutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type RuntimeStateMessage = {
 source: "hanzihome-html-artifact-runtime";
 type: "runtime-state";
 artifactId: string;
 state: HtmlArtifactRuntimeState;
};

type PublishConnectionInfo = {
 sessionUserId: string | null;
 publishTokenEnabled: boolean;
 publishOwnerId: string | null;
 serviceRoleEnabled: boolean;
};

type DeleteDialogState =
 | { kind: "artifact"; artifact: HtmlArtifact }
 | { kind: "folder"; folder: HtmlArtifactFolder };

type DragItem =
 | { type: "artifact"; id: string }
 | { type: "folder"; id: string };

type MobilePane = "files" | "preview" | "edit";
type InspectorTab = "files" | "edit";

type FolderTreeNode = HtmlArtifactFolder & {
 children: FolderTreeNode[];
};

const emptyForm: ArtifactFormState = {
 title: "",
 folderId: null,
 artifactType: "practice_page",
 tagsInput: "",
 html: "",
};

function parseTags(input: string): string[] {
 const seen = new Set<string>();
 const tags: string[] = [];

 for (const rawTag of input.split(",")) {
  const tag = rawTag.trim();
  if (!tag || seen.has(tag)) continue;
  seen.add(tag);
  tags.push(tag);
 }

 return tags;
}

function formatTags(tags: string[]): string {
 return tags.join(", ");
}

function toArtifactFormState(
 artifact: HtmlArtifact | null,
 defaultFolderId: string | null,
): ArtifactFormState {
 if (!artifact) {
  return {
   ...emptyForm,
   folderId: defaultFolderId,
  };
 }

 return {
  title: artifact.title,
  folderId: artifact.folderId,
  artifactType: artifact.artifactType,
  tagsInput: formatTags(artifact.tags),
  html: artifact.html,
 };
}

function getArtifactFormSaveKey(formState: ArtifactFormState): string {
 return JSON.stringify({
  title: formState.title.trim(),
  folderId: formState.folderId,
  artifactType: formState.artifactType,
  tags: parseTags(formState.tagsInput),
  html: formState.html.trim(),
 });
}

function getAutoSaveLabel(status: AutoSaveStatus, hasArtifact: boolean) {
 if (!hasArtifact) return "Chưa tạo DB";
 if (status === "dirty") return "Chờ sync DB";
 if (status === "saving") return "Đang sync DB...";
 if (status === "error") return "Lỗi sync DB";
 return "Đã sync DB";
}

function serializeForInlineScript(value: unknown): string {
 return JSON.stringify(value)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
}

function isRuntimeState(value: unknown): value is HtmlArtifactRuntimeState {
 if (!value || typeof value !== "object" || Array.isArray(value)) return false;

 return Object.values(value).every((item) => typeof item === "string");
}

function isRuntimeStateMessage(value: unknown): value is RuntimeStateMessage {
 if (!value || typeof value !== "object") return false;

 const message = value as {
  source?: unknown;
  type?: unknown;
  artifactId?: unknown;
  state?: unknown;
 };

 return (
  message.source === "hanzihome-html-artifact-runtime" &&
  message.type === "runtime-state" &&
  typeof message.artifactId === "string" &&
  isRuntimeState(message.state)
 );
}

function buildRuntimeStateBridgeScript(
 artifactId: string,
 runtimeState: HtmlArtifactRuntimeState,
): string {
 return `<script data-hanzihome-runtime-bridge>
(() => {
  const artifactId = ${serializeForInlineScript(artifactId)};
  const initialState = ${serializeForInlineScript(runtimeState)};
  const nativeLocalStorage = window.localStorage;
  const state = new Map(Object.entries(initialState).map(([key, value]) => [String(key), String(value)]));
  const cleanupNativeStorage = (key) => {
    try {
      nativeLocalStorage?.removeItem(String(key));
    } catch {}
  };
  const snapshot = () => Object.fromEntries(state.entries());
  const postState = () => {
    window.parent?.postMessage({
      source: "hanzihome-html-artifact-runtime",
      type: "runtime-state",
      artifactId,
      state: snapshot(),
    }, "*");
  };
  let timer = 0;
  const schedulePost = (immediate = false) => {
    if (timer) window.clearTimeout(timer);
    if (immediate) {
      postState();
      return;
    }
    timer = window.setTimeout(postState, 150);
  };

  for (const key of state.keys()) cleanupNativeStorage(key);

  const target = {};
  Object.defineProperties(target, {
    length: { get: () => state.size },
    key: { value: (index) => Array.from(state.keys())[Number(index)] ?? null },
    getItem: { value: (key) => {
      const storageKey = String(key);
      cleanupNativeStorage(storageKey);
      return state.has(storageKey) ? state.get(storageKey) : null;
    }},
    setItem: { value: (key, value) => {
      const storageKey = String(key);
      state.set(storageKey, String(value));
      cleanupNativeStorage(storageKey);
      schedulePost();
    }},
    removeItem: { value: (key) => {
      const storageKey = String(key);
      state.delete(storageKey);
      cleanupNativeStorage(storageKey);
      schedulePost();
    }},
    clear: { value: () => {
      for (const key of state.keys()) cleanupNativeStorage(key);
      state.clear();
      schedulePost();
    }},
  });

  const storage = new Proxy(target, {
    get(targetValue, property) {
      if (property in targetValue) return targetValue[property];
      if (typeof property === "string") {
        cleanupNativeStorage(property);
        return state.has(property) ? state.get(property) : undefined;
      }
      return undefined;
    },
    set(_targetValue, property, value) {
      if (typeof property === "string") {
        state.set(property, String(value));
        cleanupNativeStorage(property);
        schedulePost();
      }
      return true;
    },
    deleteProperty(_targetValue, property) {
      if (typeof property === "string") {
        state.delete(property);
        cleanupNativeStorage(property);
        schedulePost();
      }
      return true;
    },
    ownKeys: () => Array.from(state.keys()),
    getOwnPropertyDescriptor(_targetValue, property) {
      if (typeof property !== "string" || !state.has(property)) return undefined;
      return { configurable: true, enumerable: true, value: state.get(property) };
    },
  });

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  window.addEventListener("pagehide", () => schedulePost(true));
})();
</script>`;
}

function injectRuntimeStateBridge(
 source: string,
 artifactId: string,
 runtimeState: HtmlArtifactRuntimeState,
): string {
 const bridgeScript = buildRuntimeStateBridgeScript(artifactId, runtimeState);
 const headMatch = source.match(/<head\b[^>]*>/i);

 if (!headMatch?.index) {
  if (headMatch?.[0]) {
   return source.replace(headMatch[0], `${headMatch[0]}${bridgeScript}`);
  }

  return `${bridgeScript}${source}`;
 }

 return `${source.slice(0, headMatch.index + headMatch[0].length)}${bridgeScript}${source.slice(
  headMatch.index + headMatch[0].length,
 )}`;
}

async function formatHtmlSource(source: string): Promise<string> {
 const [prettier, htmlPlugin] = await Promise.all([
  import("prettier/standalone"),
  import("prettier/plugins/html"),
 ]);

 const formatted = await prettier.format(source.trim(), {
  parser: "html",
  plugins: [htmlPlugin],
  printWidth: 100,
  tabWidth: 2,
 });

 return formatted.trimEnd();
}

function getApiErrorMessage(error: unknown, fallback: string): string {
 return error instanceof HtmlArtifactsApiError ? error.message : fallback;
}

function formatDate(date: string): string {
 return new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
 }).format(new Date(date));
}

function getArtifactTitle(artifact: HtmlArtifactSummary | HtmlArtifact | null): string {
 return artifact?.title.trim() || "HTML artifact";
}

function getFolderCount(artifacts: HtmlArtifactSummary[], folderId: FolderFilter): number {
 if (folderId === "all") return artifacts.length;
 if (folderId === "unfiled") return artifacts.filter((artifact) => !artifact.folderId).length;
 return artifacts.filter((artifact) => artifact.folderId === folderId).length;
}

function buildFolderTree(folders: HtmlArtifactFolder[]): FolderTreeNode[] {
 const nodeById = new Map<string, FolderTreeNode>();
 const roots: FolderTreeNode[] = [];

 for (const folder of folders) {
  nodeById.set(folder.id, { ...folder, children: [] });
 }

 for (const folder of folders) {
  const node = nodeById.get(folder.id);
  if (!node) continue;
  const parent = folder.parentFolderId ? nodeById.get(folder.parentFolderId) : null;
  if (parent) {
   parent.children.push(node);
  } else {
   roots.push(node);
  }
 }

 return roots;
}

function hasFolderDescendant(
 folders: HtmlArtifactFolder[],
 folderId: string,
 possibleDescendantId: string,
) {
 const childrenByParentId = new Map<string, string[]>();

 for (const folder of folders) {
  if (!folder.parentFolderId) continue;
  const children = childrenByParentId.get(folder.parentFolderId) ?? [];
  children.push(folder.id);
  childrenByParentId.set(folder.parentFolderId, children);
 }

 const stack = [...(childrenByParentId.get(folderId) ?? [])];
 const visited = new Set<string>();

 while (stack.length > 0) {
  const current = stack.pop();
  if (!current || visited.has(current)) continue;
  if (current === possibleDescendantId) return true;
  visited.add(current);
  stack.push(...(childrenByParentId.get(current) ?? []));
 }

 return false;
}

export function HanziHomeHtmlArtifactsPage() {
 const artifactsQuery = useHtmlArtifactSummariesQuery();
 const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
 const [activeFolderId, setActiveFolderId] = useState<FolderFilter>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [mobilePane, setMobilePane] = useState<MobilePane>("preview");
 const [inspectorTab, setInspectorTab] = useState<InspectorTab>("files");
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
 const effectiveSelectedId =
 selectedId === "new" ? null : selectedId ?? artifacts[0]?.id ?? null;
 const selectedArtifactQuery = useHtmlArtifactQuery(effectiveSelectedId);
 const selectedArtifact = selectedArtifactQuery.data ?? null;
 const runtimeStateQuery = useHtmlArtifactRuntimeStateQuery(selectedArtifact?.id ?? null);
 const isSaving = createMutation.isPending || updateMutation.isPending;
 const isDeleting = deleteMutation.isPending;
 const isFolderMutating =
  createFolderMutation.isPending || updateFolderMutation.isPending || deleteFolderMutation.isPending;

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

 const defaultFolderId = activeFolderId !== "all" && activeFolderId !== "unfiled" ? activeFolderId : null;

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

 const resetForNewArtifact = () => {
  setSelectedId("new");
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

  if (parentFolderId && (folderId === parentFolderId || hasFolderDescendant(folders, folderId, parentFolderId))) {
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
   setSelectedId(nextArtifact?.id ?? "new");
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
    setSelectedId(nextArtifact.id);
    if (!options.silent) {
     setMobilePane("preview");
     toast.success("Đã lưu tệp HTML");
    }
    return;
   }

   if (options.silent) return;

   const nextArtifact = await createMutation.mutateAsync(payload);
   setSelectedId(nextArtifact.id);
   setMobilePane("preview");
   toast.success("Đã tạo tệp HTML");
  } catch (error) {
   if (!options.silent) {
    toast.error(getApiErrorMessage(error, "Không thể lưu tệp HTML"));
   }
   throw error;
  }
 };

 return (
  <main className="flex h-[calc(100dvh-3.5rem-88px-env(safe-area-inset-bottom))] min-h-0 w-full flex-col overflow-hidden md:h-[calc(100dvh-3.5rem)]">
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
     <PreviewPane
      selectedArtifact={previewArtifact}
      selectedSummary={selectedSummary}
      runtimeState={runtimeStateQuery.data ?? emptyRuntimeState}
      isFetching={
       (selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)) ||
       (runtimeStateQuery.isFetching && Boolean(selectedArtifact))
      }
      isFocused={isPreviewFocused}
      onRuntimeStateChange={queueRuntimeStateSave}
      onToggleFocus={() => setIsPreviewFocused((focused) => !focused)}
     />
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
         setMobilePane("edit");
        }}
        onCreateFolder={openCreateFolderDialog}
        onOpenPublishDialog={() => setIsPublishDialogOpen(true)}
        onDeleteActiveFolder={requestDeleteActiveFolder}
        onDragEnd={() => setDragItem(null)}
        onDragStart={setDragItem}
        onDropOnFolder={dropOnFolder}
        onSearchChange={setSearchQuery}
        onSelectArtifact={(artifactId) => {
         setSelectedId(artifactId);
         setMobilePane("preview");
        }}
        onSelectFolder={setActiveFolderId}
       />
      ) : null}
      {mobilePane === "preview" ? (
       <PreviewPane
        selectedArtifact={previewArtifact}
        selectedSummary={selectedSummary}
        runtimeState={runtimeStateQuery.data ?? emptyRuntimeState}
        isFetching={
         (selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)) ||
         (runtimeStateQuery.isFetching && Boolean(selectedArtifact))
        }
        isFocused={isPreviewFocused}
        onRuntimeStateChange={queueRuntimeStateSave}
        onToggleFocus={() => setIsPreviewFocused((focused) => !focused)}
       />
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
     <PreviewPane
      selectedArtifact={previewArtifact}
      selectedSummary={selectedSummary}
      runtimeState={runtimeStateQuery.data ?? emptyRuntimeState}
      isFetching={
       (selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)) ||
       (runtimeStateQuery.isFetching && Boolean(selectedArtifact))
      }
      isFocused={isPreviewFocused}
      onRuntimeStateChange={queueRuntimeStateSave}
      onToggleFocus={() => setIsPreviewFocused((focused) => !focused)}
     />
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
      <PreviewPane
       selectedArtifact={previewArtifact}
       selectedSummary={selectedSummary}
       runtimeState={runtimeStateQuery.data ?? emptyRuntimeState}
       isFetching={
        (selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)) ||
        (runtimeStateQuery.isFetching && Boolean(selectedArtifact))
       }
       isFocused={isPreviewFocused}
       onRuntimeStateChange={queueRuntimeStateSave}
       onToggleFocus={() => setIsPreviewFocused((focused) => !focused)}
      />
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
        setInspectorTab("edit");
       }}
       onCreateFolder={openCreateFolderDialog}
       onDelete={requestDeleteSelectedArtifact}
       onDeleteActiveFolder={requestDeleteActiveFolder}
       onDragEnd={() => setDragItem(null)}
       onDragStart={setDragItem}
       onDropOnFolder={dropOnFolder}
       onSearchChange={setSearchQuery}
       onSelectArtifact={setSelectedId}
       onSelectFolder={setActiveFolderId}
       onOpenPublishDialog={() => setIsPublishDialogOpen(true)}
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
         ? "bg-bg-card text-primary shadow-theme-sm"
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
 onDelete,
 onDeleteActiveFolder,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onSearchChange,
 onSelectArtifact,
 onSelectFolder,
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
 onDelete: () => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
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
     className="grid h-10 w-full grid-cols-2 gap-1 rounded-xl bg-bg-subtle p-1"
    >
     <InspectorTabButton
      active={activeTab === "files"}
      icon={Folder}
      label="Tệp"
      count={filteredArtifacts.length}
      onClick={() => onTabChange("files")}
     />
     <InspectorTabButton
      active={activeTab === "edit"}
      icon={FileCode2}
      label={artifact ? "Sửa" : "Tạo"}
      onClick={() => onTabChange("edit")}
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
      onOpenPublishDialog={onOpenPublishDialog}
      onDeleteActiveFolder={onDeleteActiveFolder}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDropOnFolder={onDropOnFolder}
      onSearchChange={onSearchChange}
      onSelectArtifact={onSelectArtifact}
      onSelectFolder={onSelectFolder}
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
     ? "bg-bg-card text-primary shadow-theme-sm"
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
 onOpenPublishDialog,
 onDeleteActiveFolder,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onSearchChange,
 onSelectArtifact,
 onSelectFolder,
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
 onOpenPublishDialog: () => void;
 onDeleteActiveFolder: () => void;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onSearchChange: (value: string) => void;
 onSelectArtifact: (id: string) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
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

   <div className="max-h-64 shrink-0 overflow-y-auto border-b border-border-default bg-bg-card p-3 scrollbar-soft">
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
       onDragEnd={onDragEnd}
       onDragStart={onDragStart}
       onDropOnFolder={onDropOnFolder}
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

   <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-card px-4">
    <div className="flex min-w-0 items-center gap-2">
     <h3 className="text-sm font-black text-text-primary">Tệp</h3>
     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
      {filteredArtifacts.length}
     </span>
    </div>
    <div className="flex shrink-0 items-center gap-2">
     <Button type="button" variant="outline" size="sm" onClick={onOpenPublishDialog}>
      <PlugZap className="h-4 w-4" />
      Kết nối
     </Button>
     <Button type="button" size="sm" onClick={onCreateArtifact}>
      <Plus className="h-4 w-4" />
      Tệp mới
     </Button>
    </div>
   </div>

   <div className="min-h-0 flex-1 overflow-y-auto bg-bg-subtle p-3 scrollbar-soft">
    {isLoading && (
     <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-subtle p-3 text-sm font-bold text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      Đang tải...
     </div>
    )}

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
     <div className="grid gap-2">
      {filteredArtifacts.map((artifact) => (
       <ArtifactListButton
        key={artifact.id}
        artifact={artifact}
        active={artifact.id === selectedId}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
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
 onDragEnd,
 onDragStart,
 onClick,
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
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onClick: () => void;
 onDrop: () => void;
}) {
 const canDrop =
  dragItem?.type === "artifact" || (dragItem?.type === "folder" && acceptsFolderDrop && dragItem.id !== folderId);

 const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
  if (!canDrop) return;
  event.preventDefault();
 };

 const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
  if (!canDrop) return;
  event.preventDefault();
  onDrop();
 };

 return (
  <button
   type="button"
   draggable={Boolean(folderId)}
   onDragStart={() => {
    if (folderId) onDragStart({ type: "folder", id: folderId });
   }}
   onDragEnd={onDragEnd}
   onDragOver={handleDragOver}
   onDrop={handleDrop}
   onClick={onClick}
   className={cn(
    "flex min-h-11 min-w-0 items-center gap-2 rounded-lg border px-2 text-left text-sm font-bold transition-colors",
    active
     ? "border-primary/45 bg-primary/10 text-primary shadow-theme-sm"
     : "border-border-default bg-bg-primary text-text-secondary hover:border-primary/25 hover:bg-bg-subtle hover:text-text-primary",
    canDrop && "data-[drag-over=true]:border-primary/50",
   )}
   style={{ paddingLeft: `${8 + depth * 16}px` }}
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
 );
}

function FolderTreeRow({
 activeFolderId,
 artifacts,
 dragItem,
 folder,
 onDragEnd,
 onDragStart,
 onDropOnFolder,
 onSelectFolder,
 depth = 0,
}: {
 activeFolderId: FolderFilter;
 artifacts: HtmlArtifactSummary[];
 dragItem: DragItem | null;
 folder: FolderTreeNode;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onDropOnFolder: (folderId: string | null) => void;
 onSelectFolder: (folderId: FolderFilter) => void;
 depth?: number;
}) {
 return (
  <>
   <FolderRow
    active={activeFolderId === folder.id}
    count={getFolderCount(artifacts, folder.id)}
    depth={depth}
    dragItem={dragItem}
    folderId={folder.id}
    name={folder.name}
    color={folder.color}
    onDragEnd={onDragEnd}
    onDragStart={onDragStart}
    onClick={() => onSelectFolder(folder.id)}
    onDrop={() => onDropOnFolder(folder.id)}
   />
   {folder.children.map((child) => (
    <FolderTreeRow
     key={child.id}
     activeFolderId={activeFolderId}
     artifacts={artifacts}
     dragItem={dragItem}
     folder={child}
     depth={depth + 1}
     onDragEnd={onDragEnd}
     onDragStart={onDragStart}
     onDropOnFolder={onDropOnFolder}
     onSelectFolder={onSelectFolder}
    />
   ))}
  </>
 );
}

function PreviewPane({
 isFocused,
 selectedArtifact,
 selectedSummary,
 runtimeState,
 isFetching,
 onRuntimeStateChange,
 onToggleFocus,
}: {
 isFocused: boolean;
 selectedArtifact: HtmlArtifact | null;
 selectedSummary: HtmlArtifactSummary | null;
 runtimeState: HtmlArtifactRuntimeState;
 isFetching: boolean;
 onRuntimeStateChange: (artifactId: string, state: HtmlArtifactRuntimeState) => void;
 onToggleFocus: () => void;
}) {
 const iframeRef = useRef<HTMLIFrameElement | null>(null);
 const iframeSrcDoc = useMemo(() => {
  if (!selectedArtifact || isFetching) return "";

  return injectRuntimeStateBridge(selectedArtifact.html, selectedArtifact.id, runtimeState);
 }, [isFetching, runtimeState, selectedArtifact]);

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
      {selectedArtifact?.updatedAt ? `Cập nhật ${formatDate(selectedArtifact.updatedAt)}` : "Xem trước"}
     </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
     <span className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
      <Code2 className="h-3.5 w-3.5" />
      iframe
     </span>
     <Button type="button" variant="outline" size="sm" onClick={onToggleFocus}>
      {isFocused ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      {isFocused ? "Thu nhỏ" : "Phóng to"}
     </Button>
    </div>
   </div>

   <div className="min-h-0 flex-1 overflow-auto bg-white">
    {isFetching ? (
     <div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      Đang tải HTML...
     </div>
    ) : selectedArtifact ? (
     <iframe
      ref={iframeRef}
      key={`${selectedArtifact.id}-${selectedArtifact.updatedAt}`}
      title={selectedArtifact.title}
      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
      srcDoc={iframeSrcDoc}
      className="h-full min-h-[32rem] w-full border-0"
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
  : "<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\" /></head><body>...</body></html>";
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
         onClick={() => void copyText(buildFetchSnippet(getCurrentEndpoint()), "Đã copy ví dụ fetch")}
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
       <code>mode: &quot;upsert&quot;</code> sẽ update khi có <code>artifactId</code>,
       còn không có thì tạo tệp mới.
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
    "h-full min-h-0 overflow-y-auto bg-bg-subtle p-4 scrollbar-soft",
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
       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
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
}: {
 artifact: HtmlArtifact | null;
 defaultFolderId: string | null;
 folders: HtmlArtifactFolder[];
 isSaving: boolean;
 isDeleting: boolean;
 onDraftChange: (formState: ArtifactFormState) => void;
 onSubmit: ArtifactSubmitHandler;
 onDelete: () => void;
}) {
 const [form, setForm] = useState<ArtifactFormState>(() =>
  toArtifactFormState(artifact, defaultFolderId),
 );
 const [isFormattingHtml, setIsFormattingHtml] = useState(false);
 const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
 const autoSaveTimerRef = useRef<number | null>(null);
 const latestFormRef = useRef(form);
 const submitRef = useRef(onSubmit);
 const lastSavedKeyRef = useRef(
  artifact ? getArtifactFormSaveKey(toArtifactFormState(artifact, defaultFolderId)) : "",
 );

 const updateForm = (updater: (current: ArtifactFormState) => ArtifactFormState) => {
  if (artifact) setAutoSaveStatus("dirty");
  setForm((current) => {
   const next = updater(current);
   latestFormRef.current = next;
   onDraftChange(next);
   return next;
  });
 };

 useEffect(() => {
  submitRef.current = onSubmit;
 }, [onSubmit]);

 useEffect(() => {
  latestFormRef.current = form;
 }, [form]);

 useEffect(() => {
  return () => {
   if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
  };
 }, []);

 useEffect(() => {
  if (!artifact) return;

  const currentKey = getArtifactFormSaveKey(form);
  if (!lastSavedKeyRef.current) {
   lastSavedKeyRef.current = getArtifactFormSaveKey(toArtifactFormState(artifact, defaultFolderId));
  }

  if (currentKey === lastSavedKeyRef.current) {
   return;
  }

  if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);

  if (!form.title.trim() || !form.html.trim()) {
   return;
  }

  autoSaveTimerRef.current = window.setTimeout(() => {
   const formToSave = latestFormRef.current;
   setAutoSaveStatus("saving");
   void Promise.resolve(submitRef.current(formToSave, { silent: true }))
    .then(() => {
     lastSavedKeyRef.current = getArtifactFormSaveKey(formToSave);
     setAutoSaveStatus("saved");
    })
    .catch(() => {
     setAutoSaveStatus("error");
    });
  }, 900);

  return () => {
   if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
  };
 }, [artifact, defaultFolderId, form]);

 const submitForm = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi lưu.");
   return;
  }
  void Promise.resolve(onSubmit(form))
   .then(() => {
    if (artifact) {
     lastSavedKeyRef.current = getArtifactFormSaveKey(form);
     setAutoSaveStatus("saved");
    }
   })
   .catch(() => {
    if (artifact) setAutoSaveStatus("error");
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
   className="flex min-h-full flex-col gap-4 rounded-xl border-2 border-border-default bg-bg-card p-4 shadow-theme-lg"
   onSubmit={submitForm}
  >
   <div className="flex items-center justify-between gap-2">
    <h2 className="font-black text-text-primary">{artifact ? "Sửa tệp" : "Tạo tệp"}</h2>
    <div className="flex gap-2">
     {artifact && (
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
     <Button type="submit" size="sm" disabled={isSaving || isDeleting}>
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Lưu DB
     </Button>
    </div>
   </div>

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
      <SelectItem value={noFolderValue}>Chưa phân loại</SelectItem>
      {folders.map((folder) => (
       <SelectItem key={folder.id} value={folder.id}>
        {folder.name}
       </SelectItem>
      ))}
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
       {artifactTypes.map((type) => (
        <SelectItem key={type} value={type}>
         {artifactTypeLabels[type]}
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>

    <label className="grid gap-1.5 text-sm font-bold text-text-primary">
     Tag
    <Input
     value={form.tagsInput}
     onChange={(event) => updateForm((current) => ({ ...current, tagsInput: event.target.value }))}
     aria-label="Tag của tệp HTML"
     placeholder="SC3, mock, bổ ngữ"
     />
    </label>
   </div>

   <div className="flex min-h-0 flex-1 flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
     <div className="min-w-0">
      <span id="html-source-label" className="text-sm font-bold text-text-primary">
       HTML
      </span>
      <p
       className={cn(
        "text-xs font-bold",
        autoSaveStatus === "error" ? "text-danger" : "text-text-muted",
       )}
      >
       {getAutoSaveLabel(autoSaveStatus, Boolean(artifact))}
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
    <HtmlSourceEditor
     ariaLabelledBy="html-source-label"
     value={form.html}
     onChange={(htmlValue) => updateForm((current) => ({ ...current, html: htmlValue }))}
    />
   </div>
  </form>
 );
}

function HtmlSourceEditor({
 ariaLabelledBy,
 value,
 onChange,
}: {
 ariaLabelledBy: string;
 value: string;
 onChange: (value: string) => void;
}) {
 return (
  <div className="h-[clamp(18rem,48dvh,34rem)] overflow-hidden rounded-2xl border border-border-default bg-bg-primary shadow-inner focus-within:ring-2 focus-within:ring-ring [&_.cm-activeLine]:bg-primary/5 [&_.cm-activeLineGutter]:bg-primary/10 [&_.cm-content]:min-h-full [&_.cm-content]:py-3 [&_.cm-editor]:h-full [&_.cm-editor]:bg-bg-primary [&_.cm-focused]:outline-none [&_.cm-gutters]:border-border-default [&_.cm-gutters]:bg-bg-elevated/70 [&_.cm-line]:px-3 [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-xs [&_.cm-theme-light]:h-full">
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
 onDragEnd,
 onDragStart,
 onClick,
}: {
 artifact: HtmlArtifactSummary;
 active: boolean;
 onDragEnd: () => void;
 onDragStart: (item: DragItem) => void;
 onClick: () => void;
}) {
 return (
  <button
   type="button"
   draggable
   onDragStart={() => onDragStart({ type: "artifact", id: artifact.id })}
   onDragEnd={onDragEnd}
   onClick={onClick}
   className={cn(
    "grid gap-1 rounded-lg border p-3 text-left shadow-theme-sm transition-colors",
    active
     ? "border-primary/50 bg-primary/10 text-primary"
     : "border-border-default bg-bg-card text-text-primary hover:border-primary/30 hover:bg-bg-elevated",
   )}
  >
   <div className="flex min-w-0 items-center justify-between gap-2">
    <span className="truncate font-black">{artifact.title}</span>
    <span className="shrink-0 rounded-full bg-bg-card px-2 py-0.5 text-[0.68rem] font-black text-text-muted">
     {artifactTypeLabels[artifact.artifactType]}
    </span>
   </div>
   <p className="text-xs font-semibold text-text-muted">{formatDate(artifact.updatedAt)}</p>
   {artifact.tags.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
     {artifact.tags.map((tag) => (
      <span
       key={`${artifact.id}-${tag}`}
       className="rounded-full border border-border-default bg-bg-card px-2 py-0.5 text-[0.68rem] font-bold text-text-muted"
      >
       {tag}
      </span>
     ))}
    </div>
   )}
  </button>
 );
}
