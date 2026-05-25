"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
 className,
 ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
 <ResizablePrimitive.Group
  className={cn(
   "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
   className,
  )}
  {...props}
 />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
 withHandle = true,
 className,
 ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
 withHandle?: boolean;
}) => (
 <ResizablePrimitive.Separator
  className={cn(
   "relative flex w-4 items-center justify-center rounded-full outline-none transition hover:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-ring/40 data-[panel-group-direction=vertical]:h-4 data-[panel-group-direction=vertical]:w-full",
   className,
  )}
  {...props}
 >
  {withHandle ? (
   <span className="z-10 flex h-12 w-8 items-center justify-center rounded-full border border-border-default bg-bg-elevated text-text-muted shadow-theme-sm">
    <GripVertical className="h-4 w-4" />
   </span>
  ) : null}
 </ResizablePrimitive.Separator>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
