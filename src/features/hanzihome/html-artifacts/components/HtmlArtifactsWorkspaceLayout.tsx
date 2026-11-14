"use client";

import type { ComponentProps, ReactNode } from "react";

import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from "@/components/ui/layout/resizable";
import { MobilePaneTabs, type MobilePane } from "./HtmlArtifactInspectorPane";

const desktopLayout = {
 "html-artifacts-preview": 72,
 "html-artifacts-inspector": 28,
};
const htmlArtifactsInspectorCollapsedSize = "3.25rem";

type InspectorPanelProps = ComponentProps<typeof ResizablePanel>;

export function HtmlArtifactsMobileShell({
 activePane,
 editPane,
 filesPane,
 previewPane,
 onPaneChange,
}: {
 activePane: MobilePane;
 editPane: ReactNode;
 filesPane: ReactNode;
 previewPane: ReactNode;
 onPaneChange: (pane: MobilePane) => void;
}) {
 return (
  <div className="html-artifacts-mobile-shell flex min-h-0 flex-1 flex-col overflow-hidden">
   <MobilePaneTabs activePane={activePane} onChange={onPaneChange} />
   <div className="min-h-0 flex-1 overflow-hidden">
    {activePane === "files" ? filesPane : null}
    {activePane === "preview" ? previewPane : null}
    {activePane === "edit" ? editPane : null}
   </div>
  </div>
 );
}

export function HtmlArtifactsDesktopShell({
 inspectorPane,
 inspectorPanelRef,
 previewPane,
 onInspectorResize,
}: {
 inspectorPane: ReactNode;
 inspectorPanelRef: InspectorPanelProps["panelRef"];
 previewPane: ReactNode;
 onInspectorResize: InspectorPanelProps["onResize"];
}) {
 return (
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
    {previewPane}
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
    onResize={onInspectorResize}
    className="min-h-0 min-w-0 overflow-hidden"
   >
    {inspectorPane}
   </ResizablePanel>
  </ResizablePanelGroup>
 );
}
