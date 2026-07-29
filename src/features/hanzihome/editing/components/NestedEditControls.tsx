"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { EditableNodeWrapper } from "./EditableNodeWrapper";
import { isPrimaryEditableEntityType } from "../edit-visibility";
import type { EditableNodePath, EditableEntityType, EditableNodeRequest } from "../store/types";

type NestedEditableNode = {
 entityType: EditableEntityType;
 entityId: string;
 path: EditableNodePath;
 value: EditableNodeRequest["value"];
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
 const visibleNodes = nodes.filter((node) => isPrimaryEditableEntityType(node.entityType));
 if (!lessonId || visibleNodes.length === 0) return null;

 return (
  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent-subtle/35 p-2">
   <StudyInstructionText
    variant="overline"
    tone="accent"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {title}
   </StudyInstructionText>
   {visibleNodes.map((node) => (
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
