import { FieldValue } from "./FieldValue";
import { hasRenderableValue, type RenderableField } from "./generic-field-utils";
import type { LessonDisplayMode } from "../types";

export function FieldValueBlock({
 field,
 displayMode,
}: {
 field: RenderableField;
 displayMode: LessonDisplayMode;
}) {
 const value = field.value;
 if (!hasRenderableValue(value)) return null;

 return (
  <div className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">{field.label}</p>
   <div className="mt-2">
    <FieldValue value={value} displayMode={displayMode} />
   </div>
  </div>
 );
}
