"use client";

import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { Code2, FileCode2, Maximize2, Minimize2, PanelRightClose } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { cn } from "@/lib/utils";
import type { JsonFieldValue } from "@/types/json";
import {
 formatHtmlArtifactDate as formatDate,
 getHtmlArtifactTitle as getArtifactTitle,
} from "../html-artifact-display-utils";
import type { ArtifactFormState } from "../html-artifact-page-utils";
import { injectRuntimeStateBridge, isRuntimeStateMessage } from "../html-artifact-runtime-bridge";
import type {
 HtmlArtifact,
 HtmlArtifactFolder,
 HtmlArtifactRuntimeState,
 HtmlArtifactSummary,
} from "../html-artifact.schema";
import { EditorPane, type ArtifactSubmitHandler, type Nullable } from "./HtmlArtifactEditor";

export type PreviewMode = "iframe" | "editor";

export function PreviewPane({
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

export function ArtifactDirectorySkeleton() {
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

export function HtmlArtifactPreviewSkeleton() {
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

export function getHtmlArtifactFrameKey(artifactId: string, html: string) {
 let hash = 0;
 for (let index = 0; index < html.length; index += 1)
  hash = (hash * 31 + html.charCodeAt(index)) >>> 0;
 return `${artifactId}-${html.length}-${hash.toString(36)}`;
}

export function StableHtmlArtifactIframe({
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
