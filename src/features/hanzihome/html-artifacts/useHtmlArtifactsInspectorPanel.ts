"use client";

import { useState } from "react";

import { usePanelRef } from "@/components/ui/layout/resizable";

export function useHtmlArtifactsInspectorPanel() {
 const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
 const inspectorPanelRef = usePanelRef();

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

 return {
  expandInspector,
  inspectorPanelRef,
  isInspectorMinimized,
  minimizeInspector,
  syncInspectorMinimized,
 };
}
