"use client";

import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
 ArrowDown,
 ArrowUp,
 Copy,
 ExternalLink,
 Folder,
 FolderPlus,
 Pencil,
 Plus,
 Search,
 Trash2,
} from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";
import { formatHtmlArtifactDate as formatDate } from "../html-artifact-display-utils";
import {
 buildFolderTree,
 getFolderCount,
 type FolderFilter,
 type FolderTreeNode,
} from "../html-artifact-page-utils";
import type {
 HtmlArtifactFolder,
 HtmlArtifactFolderColor,
 HtmlArtifactSummary,
} from "../html-artifact.schema";
import type { useHtmlArtifactSummariesQuery } from "../useHtmlArtifacts";
import { artifactTypeLabels, type Nullable } from "./HtmlArtifactEditor";
import { ArtifactDirectorySkeleton } from "./HtmlArtifactPreview";

export const folderColorClasses: Record<HtmlArtifactFolderColor, string> = {
 blue: "bg-info-subtle text-info-text border-info/20",
 purple: "bg-purple-subtle text-purple-text border-purple/20",
 green: "bg-success-subtle text-success-text border-success/20",
 orange: "bg-warning-subtle text-warning-text border-warning/20",
 rose: "bg-danger-subtle text-danger-text border-danger/20",
 slate: "bg-bg-subtle text-text-secondary border-border-default",
};

export const DragItemSchema = z.discriminatedUnion("type", [
 z.object({ type: z.literal("artifact"), id: z.string() }),
 z.object({ type: z.literal("folder"), id: z.string() }),
]);
export type DragItem = z.infer<typeof DragItemSchema>;

export const MoveDirectionSchema = z.enum(["up", "down"]);
export type MoveDirection = z.infer<typeof MoveDirectionSchema>;

export function useHtmlArtifactsDesktopShell() {
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

export function DirectoryPane({
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
 onReorderFolder: (folderId: string, direction: MoveDirection) => void;
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

export function FolderRow({
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

export function FolderTreeRow({
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
 onReorderFolder: (folderId: string, direction: MoveDirection) => void;
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

export function ArtifactListButton({
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

export function ArtifactCardAction({
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
