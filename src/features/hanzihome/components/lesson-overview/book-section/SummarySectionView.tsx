import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { EmptySectionState, LooseItemGrid, hasRenderableValue } from "../CommonCards";
import type { LessonDisplayMode } from "../types";
import { arrayValue, asRecord, sectionEmptyReason, stringValue } from "../utils";
import { buildSummaryGroups } from "./summary-utils";
import { VocabularyComparisonCard } from "./VocabularyComparisonCard";

export function SummarySectionView({
 section,
 displayMode,
}: {
 section: Section;
 displayMode: LessonDisplayMode;
}) {
 const groups = buildSummaryGroups(section);
 const sectionRecord = asRecord(section);
 const summaryRecord = asRecord(sectionRecord.summary);
 const contentRecord = asRecord(sectionRecord.content);
 const looseItems = [
  ...arrayValue(sectionRecord, "items"),
  ...arrayValue(sectionRecord, "blocks"),
  ...arrayValue(summaryRecord, "items"),
  ...arrayValue(summaryRecord, "blocks"),
  ...arrayValue(contentRecord, "items"),
  ...arrayValue(contentRecord, "blocks"),
 ];

 const hasGroups = groups.length > 0;
 const comparisonItems = looseItems.filter(
  (item) => asRecord(item).type === "vocabulary_comparison",
 );
 const remainingLooseItems = looseItems.filter(
  (item) => asRecord(item).type !== "vocabulary_comparison",
 );
 const hasLooseItems = remainingLooseItems.some(hasRenderableValue);

 if (!hasGroups && !hasLooseItems && comparisonItems.length === 0) {
  return <EmptySectionState reason={sectionEmptyReason(section)} />;
 }

 return (
  <div className="grid gap-3">
   {groups.map((group) => (
    <div
     key={group.id}
     className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3"
    >
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">{group.title}</p>
     <div className="grid gap-2">
      {group.items.map((item) => (
       <div
        key={item.id}
        className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2 grid gap-1"
       >
        <p className="font-black text-text-primary">{item.label}</p>
        {item.detail && <p className="text-xs font-semibold text-text-muted">{item.detail}</p>}
       </div>
      ))}
     </div>
    </div>
   ))}

   {comparisonItems.map((item, index) => (
    <VocabularyComparisonCard
     key={stringValue(asRecord(item), "id") || `${section.id}-comparison-${index}`}
     value={item}
     displayMode={displayMode}
    />
   ))}

   {hasLooseItems && <LooseItemGrid items={remainingLooseItems} displayMode={displayMode} />}
  </div>
 );
}
