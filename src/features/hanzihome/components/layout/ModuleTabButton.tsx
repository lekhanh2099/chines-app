"use client";

import type { DragEvent } from "react";

import { Button } from "@/components/ui/button";
import type { DraggedModule, PaneId, StudyModule } from "@/features/hanzihome/context/types";
import { cn } from "@/lib/utils";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

import { moduleMeta } from "./moduleMeta";

export function ModuleTabButton({
 item,
 active,
 paneId,
 index,
 draggedModule,
 onClick,
 onDragStart,
 onDragEnd,
 onMoveModule,
}: {
 item: StudyModule;
 active: boolean;
 paneId: PaneId;
 index: number;
 draggedModule: DraggedModule | null;
 onClick: () => void;
 onDragStart: (dragged: DraggedModule) => void;
 onDragEnd: () => void;
 onMoveModule: (
  module: StudyModule,
  sourcePane: PaneId,
  targetPane: PaneId,
  targetIndex: number,
 ) => void;
}) {
 const meta = moduleMeta[item];
 const isCoarsePointer = useCoarsePointer();
 const Icon = meta.icon;
 const isDragging = draggedModule?.module === item;
 const isDropTarget =
  draggedModule !== null &&
  draggedModule.module !== item &&
  (draggedModule.sourcePane !== paneId || draggedModule.module !== item);

 const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
  onDragStart({ module: item, sourcePane: paneId });
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", item);
  event.dataTransfer.setDragImage(
   event.currentTarget,
   event.currentTarget.offsetWidth / 2,
   event.currentTarget.offsetHeight / 2,
  );
 };

 return (
  <Button
   type="button"
   variant={active ? "active" : "ghost"}
   draggable={!isCoarsePointer}
   onClick={onClick}
   onDragStart={handleDragStart}
   onDragOver={(event) => {
    if (draggedModule) {
     event.preventDefault();
     event.dataTransfer.dropEffect = "move";
    }
   }}
   onDrop={(event) => {
    event.preventDefault();
    if (draggedModule?.module) {
     onMoveModule(draggedModule.module, draggedModule.sourcePane, paneId, index);
    }
    onDragEnd();
   }}
   onDragEnd={onDragEnd}
   className={cn(
    "shrink-0 cursor-grab select-none gap-1.5 rounded-lg font-black active:cursor-grabbing sm:gap-2",
    isDragging && "opacity-40",
    isDropTarget && "hover:border-accent/60",
   )}
  >
   <Icon data-icon="inline-start" />
   {meta.label}
  </Button>
 );
}
