"use client";

import type { DragEvent } from "react";

import type { DraggedModule, PaneId, StudyModule } from "@/features/hanzihome/context/types";

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
 onMoveModule: (module: StudyModule, targetPane: PaneId, targetIndex: number) => void;
}) {
 const meta = moduleMeta[item];
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
  <button
   type="button"
   draggable
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
    if (draggedModule?.module) onMoveModule(draggedModule.module, paneId, index);
    onDragEnd();
   }}
   onDragEnd={onDragEnd}
   className={[
    "flex min-h-11 shrink-0 cursor-grab select-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 font-black transition-colors active:cursor-grabbing sm:gap-2",
    active
     ? "bg-bg-primary text-text-primary shadow-theme-sm"
     : "text-text-muted hover:bg-bg-primary hover:text-text-primary",
    isDragging ? "opacity-40" : "",
    isDropTarget ? "hover:border-accent/60" : "",
   ].join(" ")}
  >
   <Icon className="h-4 w-4" />
   {meta.label}
  </button>
 );
}
