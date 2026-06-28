"use client";

import Link from "next/link";
import type { DragEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import {
 ArrowLeft,
 Code2,
 FileCode2,
 Folder,
 FolderPlus,
 Loader2,
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
import { cn } from "@/lib/utils";
import { HtmlArtifactsApiError } from "./html-artifact-api";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
 HtmlArtifactSummary,
 HtmlArtifactType,
} from "./html-artifact.schema";
import {
 useCreateHtmlArtifactFolderMutation,
 useCreateHtmlArtifactMutation,
 useDeleteHtmlArtifactFolderMutation,
 useDeleteHtmlArtifactMutation,
 useHtmlArtifactQuery,
 useHtmlArtifactSummariesQuery,
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
const noFolderValue = "__none__";
const desktopLayout = {
 "html-artifacts-directory": 22,
 "html-artifacts-preview": 52,
 "html-artifacts-editor": 26,
};
const htmlEditorExtensions = [html({ autoCloseTags: true, matchClosingTags: true })];

type FolderFilter = "all" | "unfiled" | string;

type ArtifactFormState = {
 title: string;
 folderId: string | null;
 artifactType: HtmlArtifactType;
 tagsInput: string;
 html: string;
};

type DeleteDialogState =
 | { kind: "artifact"; artifact: HtmlArtifact }
 | { kind: "folder"; folder: HtmlArtifactFolder };

type DragItem =
 | { type: "artifact"; id: string }
 | { type: "folder"; id: string };

type MobilePane = "files" | "preview" | "edit";

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
 const isDesktopShell = useHtmlArtifactsDesktopShell();
 const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
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

 const artifacts = artifactsQuery.artifacts ?? emptyArtifactSummaries;
 const folders = artifactsQuery.folders ?? emptyArtifactFolders;
 const effectiveSelectedId =
  selectedId === "new" ? null : selectedId ?? artifacts[0]?.id ?? null;
 const selectedArtifactQuery = useHtmlArtifactQuery(effectiveSelectedId);
 const selectedArtifact = selectedArtifactQuery.data ?? null;
 const isSaving = createMutation.isPending || updateMutation.isPending;
 const isDeleting = deleteMutation.isPending;
 const isFolderMutating =
  createFolderMutation.isPending || updateFolderMutation.isPending || deleteFolderMutation.isPending;

 const selectedSummary = useMemo(
  () => artifacts.find((artifact) => artifact.id === effectiveSelectedId) ?? null,
  [artifacts, effectiveSelectedId],
 );

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

 const saveArtifact = async (formState: ArtifactFormState) => {
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
    setMobilePane("preview");
    toast.success("Đã lưu tệp HTML");
    return;
   }

   const nextArtifact = await createMutation.mutateAsync(payload);
   setSelectedId(nextArtifact.id);
   setMobilePane("preview");
   toast.success("Đã tạo tệp HTML");
  } catch (error) {
   toast.error(getApiErrorMessage(error, "Không thể lưu tệp HTML"));
  }
 };

 return (
  <main className="flex h-[calc(100dvh-3.5rem-88px-env(safe-area-inset-bottom))] min-h-0 w-full flex-col overflow-hidden bg-bg-subtle md:h-[calc(100dvh-3.5rem)]">
   <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-default bg-bg-card px-4 py-3 shadow-theme-sm lg:px-6">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
     <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-text">
       <FileCode2 className="h-5 w-5" />
      </span>
      <div className="min-w-0">
       <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-lg font-black text-text-primary">Tệp HTML</h1>
        <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
         {artifacts.length}
        </span>
       </div>
       <p className="truncate text-xs font-semibold text-text-muted">
        Quản lý các trang luyện tập HTML đã lưu trong HanziHome.
       </p>
      </div>
     </div>
    </div>

    <Button type="button" variant="outline" size="sm" asChild>
     <Link href="/hanzihome" prefetch={false}>
      <ArrowLeft className="h-4 w-4" />
      HanziHome
     </Link>
    </Button>
   </header>

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

   {isDesktopShell ? null : (
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
        selectedArtifact={selectedArtifact}
        selectedSummary={selectedSummary}
        isFetching={selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)}
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
        onSubmit={(formState) => void saveArtifact(formState)}
        onDelete={requestDeleteSelectedArtifact}
       />
      ) : null}
     </div>
    </div>
   )}

   {isDesktopShell ? (
    <ResizablePanelGroup
     id="html-artifacts-panels"
     key="html-artifacts-layout-v2"
     orientation="horizontal"
     defaultLayout={desktopLayout}
     className="html-artifacts-desktop-shell min-h-0 min-w-0 flex-1 overflow-hidden bg-border-default"
    >
     <ResizablePanel
      id="html-artifacts-directory"
      defaultSize={`${desktopLayout["html-artifacts-directory"]}%`}
      minSize="18%"
      maxSize="34%"
      className="min-h-0 min-w-0 overflow-hidden"
     >
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
       onCreateArtifact={resetForNewArtifact}
       onCreateFolder={openCreateFolderDialog}
       onDeleteActiveFolder={requestDeleteActiveFolder}
       onDragEnd={() => setDragItem(null)}
       onDragStart={setDragItem}
       onDropOnFolder={dropOnFolder}
       onSearchChange={setSearchQuery}
       onSelectArtifact={setSelectedId}
       onSelectFolder={setActiveFolderId}
      />
     </ResizablePanel>
     <ResizableHandle />
     <ResizablePanel
      id="html-artifacts-preview"
      defaultSize={`${desktopLayout["html-artifacts-preview"]}%`}
      minSize="34%"
      className="min-h-0 min-w-0 overflow-hidden"
     >
      <PreviewPane
       selectedArtifact={selectedArtifact}
       selectedSummary={selectedSummary}
       isFetching={selectedArtifactQuery.isFetching && Boolean(effectiveSelectedId)}
      />
     </ResizablePanel>
     <ResizableHandle />
     <ResizablePanel
      id="html-artifacts-editor"
      defaultSize={`${desktopLayout["html-artifacts-editor"]}%`}
      minSize="22%"
      maxSize="38%"
      className="min-h-0 min-w-0 overflow-hidden"
     >
      <EditorPane
       key={selectedArtifact?.id ?? `new-${defaultFolderId ?? "none"}`}
       artifact={selectedArtifact}
       defaultFolderId={defaultFolderId}
       folders={folders}
       isSaving={isSaving}
       isDeleting={isDeleting}
       onSubmit={(formState) => void saveArtifact(formState)}
       onDelete={requestDeleteSelectedArtifact}
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
  <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border-default bg-bg-primary">
   <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-card px-3">
    <div className="flex min-w-0 items-center gap-2">
     <h2 className="text-sm font-black text-text-primary">Thư mục</h2>
     <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
      {folders.length}
     </span>
    </div>
    <Button
     type="button"
     variant="outline"
     size="default"
     className="min-h-11 shrink-0 px-3"
     disabled={isFolderMutating}
     onClick={onCreateFolder}
    >
     <FolderPlus className="h-4 w-4" />
     Thư mục mới
    </Button>
   </div>

   <div className="grid shrink-0 gap-2 border-b border-border-default bg-bg-card p-2">
    <div className="relative">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <Input
     value={searchQuery}
     onChange={(event) => onSearchChange(event.target.value)}
     aria-label="Tìm tệp HTML"
     placeholder="Tìm tệp"
     className="h-11 pl-9"
     />
    </div>
   </div>

   <div className="max-h-64 shrink-0 overflow-y-auto border-b border-border-default bg-bg-card p-2 scrollbar-soft">
    <div className="grid gap-1">
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

   <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-default bg-bg-card px-3">
    <div className="flex min-w-0 items-center gap-2">
     <h3 className="text-sm font-black text-text-primary">Tệp</h3>
     <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
      {filteredArtifacts.length}
     </span>
    </div>
    <Button type="button" size="default" className="min-h-11 shrink-0 px-3" onClick={onCreateArtifact}>
     <Plus className="h-4 w-4" />
     Tệp mới
    </Button>
   </div>

   <div className="min-h-0 flex-1 overflow-y-auto bg-bg-subtle p-2 scrollbar-soft">
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
 selectedArtifact,
 selectedSummary,
 isFetching,
}: {
 selectedArtifact: HtmlArtifact | null;
 selectedSummary: HtmlArtifactSummary | null;
 isFetching: boolean;
}) {
 return (
  <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-x border-border-default bg-bg-card">
   <div className="flex h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-default bg-bg-card px-3">
    <div className="min-w-0">
     <h2 className="truncate text-sm font-black text-text-primary">
      {getArtifactTitle(selectedArtifact ?? selectedSummary)}
     </h2>
     <p className="truncate text-xs font-semibold text-text-muted">
      {selectedArtifact?.updatedAt ? `Cập nhật ${formatDate(selectedArtifact.updatedAt)}` : "Xem trước"}
     </p>
    </div>
    <span className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-bold text-text-muted">
     <Code2 className="h-3.5 w-3.5" />
     iframe
    </span>
   </div>

   <div className="min-h-0 flex-1 overflow-auto bg-white">
    {isFetching ? (
     <div className="flex h-full items-center justify-center gap-2 text-sm font-bold text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      Đang tải HTML...
     </div>
    ) : selectedArtifact ? (
     <iframe
      key={`${selectedArtifact.id}-${selectedArtifact.updatedAt}`}
      title={selectedArtifact.title}
      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
      srcDoc={selectedArtifact.html}
      className="h-full min-h-[32rem] w-full min-w-[22rem] border-0 xl:min-w-0"
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

function EditorPane(props: {
 artifact: HtmlArtifact | null;
 defaultFolderId: string | null;
 folders: HtmlArtifactFolder[];
 isSaving: boolean;
 isDeleting: boolean;
 onSubmit: (formState: ArtifactFormState) => void;
 onDelete: () => void;
}) {
 return (
  <aside className="h-full min-h-0 overflow-y-auto border-l-2 border-border-default bg-bg-subtle p-3 scrollbar-soft">
   <ArtifactForm {...props} />
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
 onSubmit,
 onDelete,
}: {
 artifact: HtmlArtifact | null;
 defaultFolderId: string | null;
 folders: HtmlArtifactFolder[];
 isSaving: boolean;
 isDeleting: boolean;
 onSubmit: (formState: ArtifactFormState) => void;
 onDelete: () => void;
}) {
 const [form, setForm] = useState<ArtifactFormState>(() =>
  artifact
   ? {
      title: artifact.title,
      folderId: artifact.folderId,
      artifactType: artifact.artifactType,
      tagsInput: formatTags(artifact.tags),
      html: artifact.html,
     }
   : {
      ...emptyForm,
      folderId: defaultFolderId,
     },
 );
 const [isFormattingHtml, setIsFormattingHtml] = useState(false);

 const submitForm = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi lưu.");
   return;
  }
  onSubmit(form);
 };

 const formatHtml = async () => {
  if (!form.html.trim()) {
   toast.error("Paste HTML trước khi format.");
   return;
  }

  setIsFormattingHtml(true);
  try {
   const formattedHtml = await formatHtmlSource(form.html);
   setForm((current) => ({ ...current, html: formattedHtml }));
   toast.success("Đã format HTML");
  } catch {
   toast.error("Không format được HTML. Kiểm tra lại cú pháp file.");
  } finally {
   setIsFormattingHtml(false);
  }
 };

 return (
  <form
   className="flex min-h-full flex-col gap-3 rounded-xl border-2 border-border-default bg-bg-card p-3 shadow-theme-lg"
   onSubmit={submitForm}
  >
   <div className="flex items-center justify-between gap-2">
    <h2 className="font-black text-text-primary">{artifact ? "Sửa tệp" : "Tạo tệp"}</h2>
    <div className="flex gap-2">
     {artifact && (
      <Button
       type="button"
       variant="destructive"
       size="default"
       disabled={isDeleting || isSaving}
       onClick={onDelete}
      >
       <Trash2 className="h-4 w-4" />
       Xóa
      </Button>
     )}
     <Button type="submit" size="default" disabled={isSaving || isDeleting}>
      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Lưu
     </Button>
    </div>
   </div>

   <label className="grid gap-1.5 text-sm font-bold text-text-primary">
    Tiêu đề
    <Input
     value={form.title}
     onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
     aria-label="Tiêu đề tệp HTML"
     placeholder="SC3 Mock Exam 03"
     required
    />
   </label>

   <label className="grid gap-1.5 text-sm font-bold text-text-primary">
    Thư mục
    <select
     aria-label="Chọn thư mục cho tệp HTML"
     className="h-11 rounded border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-ring"
     value={form.folderId ?? noFolderValue}
     onChange={(event) =>
      setForm((current) => ({
       ...current,
       folderId: event.target.value === noFolderValue ? null : event.target.value,
      }))
     }
    >
     <option value={noFolderValue}>Chưa phân loại</option>
     {folders.map((folder) => (
      <option key={folder.id} value={folder.id}>
       {folder.name}
      </option>
     ))}
    </select>
   </label>

   <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[150px_minmax(0,1fr)]">
    <label className="grid gap-1.5 text-sm font-bold text-text-primary">
     Loại tệp
     <select
      aria-label="Chọn loại tệp HTML"
      className="h-11 rounded border border-border-default bg-bg-primary px-3 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-ring"
      value={form.artifactType}
      onChange={(event) =>
       setForm((current) => ({
        ...current,
        artifactType: event.target.value as HtmlArtifactType,
       }))
      }
     >
      {artifactTypes.map((type) => (
       <option key={type} value={type}>
        {artifactTypeLabels[type]}
       </option>
      ))}
     </select>
    </label>

    <label className="grid gap-1.5 text-sm font-bold text-text-primary">
     Tag
     <Input
      value={form.tagsInput}
      onChange={(event) => setForm((current) => ({ ...current, tagsInput: event.target.value }))}
      aria-label="Tag của tệp HTML"
      placeholder="SC3, mock, bổ ngữ"
     />
    </label>
   </div>

   <div className="flex min-h-0 flex-1 flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
     <span id="html-source-label" className="text-sm font-bold text-text-primary">HTML</span>
     <Button
      type="button"
      variant="outline"
      size="default"
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
     onChange={(htmlValue) => setForm((current) => ({ ...current, html: htmlValue }))}
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
