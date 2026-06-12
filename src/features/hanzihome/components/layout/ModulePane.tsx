"use client";

import type { DragEvent, ReactNode } from "react";

import type { DraggedModule, PaneId, StudyModule } from "@/features/hanzihome/context/types";

import { ModuleTabButton } from "./ModuleTabButton";
import { moduleMeta } from "./moduleMeta";

export function ModulePane({
 title,
 items,
 activeModule,
 children,
 onSelectModule,
 paneId,
 draggedModule,
 className = "",
 onDragStart,
 onDragEnd,
 onMoveModule,
}: {
 title: string;
 items: StudyModule[];
 activeModule: StudyModule;
 children: ReactNode;
 onSelectModule: (module: StudyModule) => void;
 paneId: PaneId;
 draggedModule: DraggedModule | null;
 className?: string;
 onDragStart: (dragged: DraggedModule) => void;
 onDragEnd: () => void;
 onMoveModule: (module: StudyModule, targetPane: PaneId, targetIndex: number) => void;
}) {
 const canDropIntoPane =
  draggedModule !== null &&
  (draggedModule.sourcePane !== paneId || !items.includes(draggedModule.module));

 const handleDropIntoPane = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  if (draggedModule) onMoveModule(draggedModule.module, paneId, items.length);
  onDragEnd();
 };

 return (
  <section
   className={[
    "grid min-h-112 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-xl border border-border-default bg-bg-card p-2 shadow-theme-sm xl:h-full xl:min-h-0",
    className,
   ].join(" ")}
  >
   <div className="min-w-0">
    <h2 className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">{title}</h2>
    <p className="line-clamp-1 font-black text-text-primary">{moduleMeta[activeModule].label}</p>
   </div>
   <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
    <div
     className={[
      "no-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-transparent bg-bg-subtle p-1 transition-colors",
      canDropIntoPane ? "border-dashed border-accent/60" : "",
     ].join(" ")}
     onDragOver={(event) => {
      if (draggedModule) {
       event.preventDefault();
       event.dataTransfer.dropEffect = "move";
      }
     }}
     onDrop={handleDropIntoPane}
    >
     {items.map((item, index) => (
      <ModuleTabButton
       key={item}
       item={item}
       active={item === activeModule}
       paneId={paneId}
       index={index}
       draggedModule={draggedModule}
       onClick={() => onSelectModule(item)}
       onDragStart={onDragStart}
       onDragEnd={onDragEnd}
       onMoveModule={onMoveModule}
      />
     ))}
    </div>
    <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-lg bg-bg-subtle/60 p-1 scrollbar-soft sm:rounded-xl sm:p-2 sm:pr-1">
     {children}
    </div>
   </div>
  </section>
 );
}
