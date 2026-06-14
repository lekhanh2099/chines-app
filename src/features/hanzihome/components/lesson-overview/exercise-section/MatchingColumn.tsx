import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";

import type { LessonDisplayMode } from "../types";
import { asRecord, stringValue } from "../utils";
import { letterLabel } from "./exercise-utils";
import { MatchingOptionCard } from "./MatchingOptionCard";

export function MatchingColumn({
 lessonId,
 itemPath,
 itemId,
 title,
 values,
 sourceKey,
 labelMode,
 displayMode,
}: {
 lessonId?: string;
 itemPath?: DraftPatchPath;
 itemId: string;
 title: string;
 values: unknown[];
 sourceKey: string;
 labelMode: "number" | "letter";
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>

   <div className="grid gap-2">
    {values.map((value, index) => {
     const valueRecord = asRecord(value);
     const entityId = stringValue(valueRecord, "id") || `${itemId}-${sourceKey}-${index}`;
     const label = labelMode === "number" ? `${index + 1}` : letterLabel(index);
     const content = <MatchingOptionCard label={label} value={value} displayMode={displayMode} />;

     return lessonId && itemPath ? (
      <EditableNodeWrapper
       key={entityId}
       lessonId={lessonId}
       entityType="exercise_matching_item"
       entityId={entityId}
       parentEntityType="exercise"
       parentEntityId={itemId}
       path={[...itemPath, sourceKey, index]}
       value={value}
       label={`${title} ${label}`}
      >
       {content}
      </EditableNodeWrapper>
     ) : (
      <div key={entityId}>{content}</div>
     );
    })}
   </div>
  </div>
 );
}
