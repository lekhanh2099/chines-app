import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import type { LessonDisplayMode } from "../types";
import { z } from "zod";
import { asRecord, stringValue } from "../utils";
import { letterLabel } from "./exercise-utils";
import { MatchingOptionCard } from "./MatchingOptionCard";

const MatchingColumnLabelModeSchema = z.enum(["number", "letter"]);

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
 itemPath?: EditableNodePath;
 itemId: string;
 title: string;
 values: JsonValue[];
 sourceKey: string;
 labelMode: z.infer<typeof MatchingColumnLabelModeSchema>;
 displayMode: LessonDisplayMode;
}) {
 if (values.length === 0) return null;

 return (
  <div className="exercise-card-surface grid gap-2 rounded-xl border p-3">
   <StudyInstructionText
    variant="overline"
    tone="muted"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {title}
   </StudyInstructionText>

   <div className="grid gap-2">
    {values.map((value, index) => {
     const valueRecord = asRecord(value);
     const entityId = stringValue(valueRecord, "id") || `${itemId}-${sourceKey}-${index}`;
     const label =
      labelMode === MatchingColumnLabelModeSchema.enum.number ? `${index + 1}` : letterLabel(index);
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
