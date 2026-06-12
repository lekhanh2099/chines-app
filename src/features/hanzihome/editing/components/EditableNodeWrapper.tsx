"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureContext } from "@/features/hanzihome/context/hanzihomeFeatureContext";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import type { HanziHomeDbEditTarget } from "@/features/hanzihome/editor/hanzihome-db-edit.types";

import type { DraftPatchPath, EditableEntityType } from "../store/types";
import { EditButton } from "./EditButton";

type EditableNodeWrapperProps = {
 lessonId: string;
 entityType: EditableEntityType;
 entityId: string;
 parentEntityType?: EditableEntityType;
 parentEntityId?: string;
 path: DraftPatchPath;
 target?: HanziHomeDbEditTarget;
 targetRelativePath?: DraftPatchPath;
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
 target,
 targetRelativePath,
 value,
 label,
 className,
 editOnly = false,
 children,
}: EditableNodeWrapperProps) {
 const editMode = useHanziHomeEditMode();
 const { services } = useHanziHomeFeatureContext();
 const { openEditableNode } = useHanziHomeFeatureActions();

 if (!editMode) return editOnly ? null : children;

 const openNode = () => {
  const baseNode = {
   lessonId,
   entityType,
   entityId,
   parentEntityType,
   parentEntityId,
   path,
   target,
   targetRelativePath,
   value,
   label,
  };
  const resolved = services.resolveEditTarget(baseNode);

  openEditableNode({
   ...baseNode,
   target: resolved?.target ?? baseNode.target,
   targetRelativePath: resolved?.targetRelativePath ?? baseNode.targetRelativePath,
  });
 };

 return (
  <div
   className={cn(
    "group/edit relative rounded-xl outline outline-1 outline-dashed outline-accent/35 outline-offset-2",
    className,
   )}
  >
   <div className="absolute right-2 top-2 z-10 opacity-30 transition-opacity group-hover/edit:opacity-100 group-focus-within/edit:opacity-100">
    <EditButton onClick={openNode} />
   </div>
   {children}
  </div>
 );
}
