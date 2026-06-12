"use client";

import { EditableNodeWrapper } from "./EditableNodeWrapper";
import type { DraftPatchPath, EditableEntityType } from "../store/types";

type NestedEditableNode = {
 entityType: EditableEntityType;
 entityId: string;
 path: DraftPatchPath;
 value: unknown;
 label: string;
};

export function NestedEditControls({
 lessonId,
 parentEntityType,
 parentEntityId,
 title,
 nodes,
}: {
 lessonId?: string;
 parentEntityType: EditableEntityType;
 parentEntityId: string;
 title: string;
 nodes: NestedEditableNode[];
}) {
 if (!lessonId || nodes.length === 0) return null;

 return (
  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent-subtle/35 p-2">
   <p className="text-xs font-black uppercase tracking-wide text-accent-text">{title}</p>
   {nodes.map((node) => (
    <EditableNodeWrapper
     key={`${node.entityType}-${node.entityId}-${node.path.join(".")}`}
     lessonId={lessonId}
     entityType={node.entityType}
     entityId={node.entityId}
     parentEntityType={parentEntityType}
     parentEntityId={parentEntityId}
     path={node.path}
     value={node.value}
     label={node.label}
     editOnly
     className="inline-flex min-h-8 items-center px-2 pr-16 text-xs font-bold text-text-secondary"
    >
     <span>{node.label}</span>
    </EditableNodeWrapper>
   ))}
  </div>
 );
}
