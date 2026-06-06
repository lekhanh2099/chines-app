"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { useHanziHomeDraftStore } from "../store/useHanziHomeDraftStore";
import type {
 DraftPatchPath,
 EditableEntityType,
} from "../store/types";
import { EditButton } from "./EditButton";

type EditableNodeWrapperProps = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: DraftPatchPath;
 value: unknown;
 label?: string;
 className?: string;
 editOnly?: boolean;
 children: ReactNode;
};

export function EditableNodeWrapper({
 lessonId,
 entityType,
 entityId,
 parentEntityType,
 parentEntityId,
 path,
 value,
 label,
 className,
 editOnly = false,
 children,
}: EditableNodeWrapperProps) {
 const editMode = useHanziHomeDraftStore((state) => state.editMode);
 const openNode = useHanziHomeDraftStore((state) => state.openNode);

 if (!editMode) return editOnly ? null : children;

 return (
  <div
   className={cn(
    "group/edit relative rounded-xl outline outline-1 outline-dashed outline-accent/35 outline-offset-2",
    className,
   )}
  >
   <div className="absolute right-2 top-2 z-10 opacity-30 transition-opacity group-hover/edit:opacity-100 group-focus-within/edit:opacity-100">
    <EditButton
     onClick={() =>
      openNode({
       lessonId,
       entityType,
       entityId,
       parentEntityType,
       parentEntityId,
       path,
       value,
       label,
      })
     }
    />
   </div>
   {children}
  </div>
 );
}
