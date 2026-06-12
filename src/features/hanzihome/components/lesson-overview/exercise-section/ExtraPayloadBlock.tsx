import { LooseItemGrid, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";

export function ExtraPayloadBlock({
 title,
 value,
 displayMode,
}: {
 title: string;
 value: unknown;
 displayMode: LessonDisplayMode;
}) {
 if (!hasRenderableValue(value)) return null;

 const items = Array.isArray(value) ? value : [value];

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
   <LooseItemGrid items={items} displayMode={displayMode} />
  </div>
 );
}
