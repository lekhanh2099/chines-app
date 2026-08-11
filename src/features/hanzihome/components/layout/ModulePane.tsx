"use client";

import type { DragEvent, ReactNode } from "react";

import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import type {
 DraggedModule,
 NullableDraggedModule,
 PaneId,
 StudyModule,
} from "@/features/hanzihome/context/types";
import { parseStudyModule } from "@/features/hanzihome/context/workspaceLayout";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

import { moduleMeta } from "./moduleMeta";
import { ModuleTabButton } from "./ModuleTabButton";

export function ModulePane({
 items,
 availableModules,
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
 items: StudyModule[];
 availableModules: StudyModule[];
 activeModule: StudyModule;
 children: ReactNode;
 onSelectModule: (module: StudyModule) => void;
 paneId: PaneId;
 draggedModule: NullableDraggedModule;
 className?: string;
 onDragStart: (dragged: DraggedModule) => void;
 onDragEnd: () => void;
 onMoveModule: (
  module: StudyModule,
  sourcePane: PaneId,
  targetPane: PaneId,
  targetIndex: number,
 ) => void;
}) {
 const isCoarsePointer = useCoarsePointer();
 const canDropIntoPane =
  draggedModule !== null &&
  (draggedModule.sourcePane !== paneId || !items.includes(draggedModule.module));

 const handleDropIntoPane = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  if (draggedModule) {
   onMoveModule(draggedModule.module, draggedModule.sourcePane, paneId, items.length);
  }
  onDragEnd();
 };

 return (
  <section
   className={[
    "hanzihome-liquid-panel grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-xl p-2",
    className,
   ].join(" ")}
  >
   {isCoarsePointer ? (
    <div className="min-w-0">
     <Select
      value={activeModule}
      onValueChange={(value) => {
       const selectedModule = parseStudyModule(value);
       if (selectedModule) onSelectModule(selectedModule);
      }}
     >
      <SelectTrigger size="sm" width="full" aria-label="Chọn nội dung cho khung học">
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
       <SelectGroup>
        {availableModules.map((item) => {
         const meta = moduleMeta[item];
         const Icon = meta.icon;
         return (
          <SelectItem key={item} value={item}>
           <Icon />
           {meta.label}
          </SelectItem>
         );
        })}
       </SelectGroup>
      </SelectContent>
     </Select>
    </div>
   ) : (
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
   )}
   <div
    data-pane-scroll={paneId}
    className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg bg-bg-subtle/60 p-1 scrollbar-soft sm:rounded-xl sm:p-2 sm:pr-1"
   >
    {children}
   </div>
  </section>
 );
}
