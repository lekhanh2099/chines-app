"use client";

import { Code2, FileCode2, Folder, PanelRightOpen, PlugZap } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import type { ArtifactFormState, FolderFilter } from "../html-artifact-page-utils";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactSummary,
} from "../html-artifact.schema";
import type { useHtmlArtifactSummariesQuery } from "../useHtmlArtifacts";
import { DirectoryPane, MoveDirectionSchema, type DragItem } from "./HtmlArtifactDirectory";
import { EditorPane, type ArtifactSubmitHandler, type Nullable } from "./HtmlArtifactEditor";

const MobilePaneSchema = z.enum(["files", "preview", "edit"]);
export const InspectorTabSchema = z.enum([MobilePaneSchema.enum.files, "edit"]);
export type MobilePane = z.infer<typeof MobilePaneSchema>;
export type InspectorTab = z.infer<typeof InspectorTabSchema>;

export function MobilePaneTabs({
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

export function RightInspectorPane({
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
