import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 EmptySectionState,
 GenericItemCard,
 hasRenderableValue,
} from "./CommonCards";
import { ExerciseCard } from "./ExerciseSection";
import { GrammarCard } from "./GrammarSection";
import { NoteCard } from "./NotesSection";
import { ReadingCard } from "./ReadingSection";
import { TextBlockView } from "./TextSection";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "./types";
import { VocabMiniGrid } from "./VocabularySection";
import { WritingCard } from "./WritingSection";
import { arrayValue, asRecord, sectionEmptyReason, stringValue } from "./utils";

type SummaryGroup = {
 id: string;
 title: string;
 items: Array<{ id: string; label: string; detail?: string }>;
};

function titleFromValue(value: unknown, fallback: string) {
 if (typeof value === "string") return value;

 const record = asRecord(value);
 return (
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "pattern") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  fallback
 );
}

function detailFromValue(value: unknown) {
 const record = asRecord(value);
 return (
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "note_vi")
 );
}

function groupFromArray(
 sectionId: string,
 id: string,
 title: string,
 values: unknown[],
 fallbackLabel: string,
): SummaryGroup | null {
 if (values.length === 0) return null;

 return {
  id: `${sectionId}-${id}`,
  title,
  items: values.map((value, index) => ({
   id: `${sectionId}-${id}-${index}`,
   label: titleFromValue(value, `${fallbackLabel} ${index + 1}`),
   detail: detailFromValue(value),
  })),
 };
}

function buildSummaryGroups(section: Section): SummaryGroup[] {
 const sectionRecord = asRecord(section);
 const embeddedSummary = asRecord(sectionRecord.summary);
 const contentSummary = asRecord(sectionRecord.content);
 const coverage = {
  ...asRecord(sectionRecord.coverage_total),
  ...asRecord(embeddedSummary.coverage_total),
  ...asRecord(contentSummary.coverage_total),
  ...asRecord(sectionRecord.coverage),
  ...asRecord(embeddedSummary.coverage),
  ...asRecord(contentSummary.coverage),
 };
 const coverageEntries = Object.entries(coverage)
  .filter(([, value]) => typeof value === "boolean")
  .map(([key, value]) => ({
   id: `${section.id}-coverage-${key}`,
   label: key.replaceAll("_", " "),
   detail: value ? "Đã có dữ liệu" : "Chưa có dữ liệu",
  }));
 const remainingCheckValue = coverage.remaining_check_needed;
 const remainingChecks =
  typeof remainingCheckValue === "string"
   ? [remainingCheckValue]
   : arrayValue(coverage, "remaining_check_needed");

 return [
  groupFromArray(
   section.id,
   "lesson-parts",
   "Phần trong bài",
   [
    ...arrayValue(sectionRecord, "lesson_parts"),
    ...arrayValue(embeddedSummary, "lesson_parts"),
    ...arrayValue(contentSummary, "lesson_parts"),
   ],
   "Phần",
  ),
  groupFromArray(
   section.id,
   "grammar-points",
   "Điểm ngữ pháp",
   [
    ...arrayValue(sectionRecord, "grammar_points"),
    ...arrayValue(embeddedSummary, "grammar_points"),
    ...arrayValue(contentSummary, "grammar_points"),
   ],
   "Ngữ pháp",
  ),
  groupFromArray(
   section.id,
   "patterns",
   "Mẫu câu / câu trọng tâm",
   [
    ...arrayValue(sectionRecord, "key_patterns"),
    ...arrayValue(sectionRecord, "key_sentence_patterns"),
    ...arrayValue(sectionRecord, "key_sentences"),
    ...arrayValue(sectionRecord, "main_patterns"),
    ...arrayValue(sectionRecord, "exercise_types"),
    ...arrayValue(embeddedSummary, "key_patterns"),
    ...arrayValue(embeddedSummary, "key_sentence_patterns"),
    ...arrayValue(embeddedSummary, "key_sentences"),
    ...arrayValue(embeddedSummary, "main_patterns"),
    ...arrayValue(embeddedSummary, "exercise_types"),
    ...arrayValue(contentSummary, "key_patterns"),
    ...arrayValue(contentSummary, "key_sentence_patterns"),
    ...arrayValue(contentSummary, "key_sentences"),
    ...arrayValue(contentSummary, "main_patterns"),
    ...arrayValue(contentSummary, "exercise_types"),
   ],
   "Câu",
  ),
  coverageEntries.length > 0
   ? {
      id: `${section.id}-coverage`,
      title: "Coverage dữ liệu",
      items: coverageEntries,
     }
   : null,
  groupFromArray(
   section.id,
   "remaining-checks",
   "Cần kiểm tra thêm",
   remainingChecks,
   "Mục",
  ),
 ].filter((group): group is SummaryGroup => Boolean(group));
}

function SummarySectionView({ section }: { section: Section }) {
 const groups = buildSummaryGroups(section);

 if (groups.length === 0) {
  return <EmptySectionState reason={sectionEmptyReason(section)} />;
 }

 return (
  <div className="grid gap-3">
   {groups.map((group) => (
    <div
     key={group.id}
     className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3"
    >
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      {group.title}
     </p>
     <div className="grid gap-2">
      {group.items.map((item) => (
       <div
        key={item.id}
        className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2"
       >
        <p className="text-sm font-black text-text-primary">{item.label}</p>
        {item.detail && (
         <p className="mt-1 text-xs font-semibold text-text-muted">
          {item.detail}
         </p>
        )}
       </div>
      ))}
     </div>
    </div>
   ))}
  </div>
 );
}

export function BookSectionContent({
 section,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
}: {
 section: Section;
 displayMode?: LessonDisplayMode;
}) {
 const renderSectionFallback = () =>
  hasRenderableValue(section) ? (
   <GenericItemCard value={section} displayMode={displayMode} />
  ) : (
   <EmptySectionState reason={sectionEmptyReason(section)} />
  );

 if (section.type === "text") {
  return section.blocks.length > 0 ? (
   <div className="grid gap-3">
    {section.blocks.map((block) => (
     <TextBlockView key={block.id} block={block} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "vocabulary") {
  return section.items.length > 0 ? (
   <VocabMiniGrid items={section.items} displayMode={displayMode} />
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "notes") {
  return section.items.length > 0 ? (
   <div className="grid gap-3">
    {section.items.map((item) => (
     <NoteCard key={item.id} item={item} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "grammar") {
  return section.items.length > 0 ? (
   <div className="grid gap-3">
    {section.items.map((item) => (
     <GrammarCard key={item.id} item={item} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "exercises") {
  return section.items.length > 0 ? (
   <div className="grid gap-2">
    {section.items.map((item) => (
     <ExerciseCard key={item.id} item={item} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "reading") {
  return section.items.length > 0 ? (
   <div className="grid gap-2">
    {section.items.map((item) => (
     <ReadingCard key={item.id} item={item} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "character_writing") {
  return section.items.length > 0 ? (
   <div className="grid gap-2 md:grid-cols-3">
    {section.items.map((item) => (
     <WritingCard key={item.id} item={item} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 const sectionRecord = asRecord(section);
 const looseItems = [
  ...arrayValue(sectionRecord, "items"),
  ...arrayValue(sectionRecord, "blocks"),
 ];
 if (section.type === "summary") {
  return <SummarySectionView section={section} />;
 }

 const renderItems = looseItems;

 if (section.type === "communication") {
  return section.items.length > 0 ? (
   <div className="grid gap-3">
    {section.items.map((item, index) => (
     <GenericItemCard
      key={stringValue(asRecord(item), "id") || `${section.id}-${index}`}
      value={item}
      displayMode={displayMode}
     />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 if (section.type === "proper_nouns") {
  return renderItems.length > 0 ? (
   <div className="grid gap-2 sm:grid-cols-2">
    {renderItems.map((item, index) => (
     <GenericItemCard
      key={stringValue(asRecord(item), "id") || `${section.id}-${index}`}
      value={item}
      displayMode={displayMode}
     />
    ))}
   </div>
  ) : (
   renderSectionFallback()
  );
 }

 return renderItems.length > 0 ? (
  <div className="grid gap-2">
   {renderItems.map((item, index) => (
    <GenericItemCard
     key={stringValue(asRecord(item), "id") || index}
     value={item}
     displayMode={displayMode}
    />
   ))}
  </div>
) : (
  renderSectionFallback()
 );
}
