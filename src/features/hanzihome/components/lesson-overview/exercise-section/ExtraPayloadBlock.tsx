import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { JsonFieldValue, JsonValue } from "@/types/json";
import { LooseItemGrid, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";

export function ExtraPayloadBlock({
 title,
 value,
 displayMode,
}: {
 title: string;
 value: JsonFieldValue;
 displayMode: LessonDisplayMode;
}) {
 if (!hasRenderableValue(value)) return null;

 const items = (Array.isArray(value) ? value : [value]).filter(
  (item): item is JsonValue => item !== undefined,
 );

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
   <LooseItemGrid items={items} displayMode={displayMode} />
  </div>
 );
}
