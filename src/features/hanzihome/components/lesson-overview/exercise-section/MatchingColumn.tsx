import { Fragment } from "react";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonValue } from "@/types/json";

import type { LessonDisplayMode } from "../types";
import { z } from "zod";
import { asRecord, stringValue } from "../utils";
import { letterLabel } from "./exercise-utils";
import { MatchingOptionCard } from "./MatchingOptionCard";

const MatchingColumnLabelModeSchema = z.enum(["number", "letter"]);

export function MatchingColumn({
 itemId,
 title,
 values,
 sourceKey,
 labelMode,
 displayMode,
}: {
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

     return <Fragment key={entityId}>{content}</Fragment>;
    })}
   </div>
  </div>
 );
}
