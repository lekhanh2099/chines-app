"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from "@/components/ui/resizable";

export function StudySplitLayout({
 left,
 right,
 mode,
 storageKey,
 defaultLeft = 56,
 minLeft = 36,
 minRight = 32,
}: {
 left: ReactNode;
 right: ReactNode;
 mode: "left" | "right" | "split";
 storageKey?: string;
 defaultLeft?: number;
 minLeft?: number;
 minRight?: number;
}) {
 const [leftSize, setLeftSize] = useState(() => {
  if (!storageKey || typeof window === "undefined") return defaultLeft;
  const stored = window.localStorage.getItem(storageKey);
  return stored ? Number(stored) : defaultLeft;
 });

 if (mode === "left") return <>{left}</>;
 if (mode === "right") return <>{right}</>;

  return (
  <ResizablePanelGroup
   orientation="horizontal"
   defaultLayout={{ left: leftSize, right: 100 - leftSize }}
   className="min-h-[560px] gap-3"
  >
   <ResizablePanel
    id="left"
    defaultSize={leftSize}
    minSize={minLeft}
    onResize={(panelSize) => {
     const next = Math.round(panelSize.asPercentage);
     setLeftSize(next);
     if (storageKey && typeof window !== "undefined") window.localStorage.setItem(storageKey, String(next));
    }}
   >
    {left}
   </ResizablePanel>
   <ResizableHandle />
   <ResizablePanel id="right" defaultSize={100 - leftSize} minSize={minRight}>
    {right}
   </ResizablePanel>
  </ResizablePanelGroup>
 );
}
