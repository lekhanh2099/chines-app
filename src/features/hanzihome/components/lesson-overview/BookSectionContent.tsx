import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import {
 EditableNodeWrapper,
 type DraftPatchPath,
} from "@/features/hanzihome/editing";

import {
 EmptySectionState,
 GenericItemCard,
 LooseItemGrid,
 hasRenderableValue,
} from "./CommonCards";
import { ExerciseCard } from "./ExerciseSection";
import { GrammarCard } from "./GrammarSection";
import { NoteCard } from "./NotesSection";
import { ReadingCard } from "./ReadingSection";
import { TextBlockView } from "./TextSection";
import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
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
  stringValue(record, "label") ||
  stringValue(record, "id") ||
  fallback
 );
}

function detailFromValue(value: unknown) {
 const record = asRecord(value);

 return (
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "pinyin") ||
  stringValue(record, "note_vi") ||
  stringValue(record, "grammar_ref")
 );
}

function groupFromArray(
 sectionId: string,
 id: string,
 title: string,
 values: unknown[],
 fallbackLabel: string,
): SummaryGroup | null {
 const visibleValues = values.filter(hasRenderableValue);
 if (visibleValues.length === 0) return null;

 return {
  id: `${sectionId}-${id}`,
  title,
  items: visibleValues.map((value, index) => ({
   id: `${sectionId}-${id}-${index}`,
   label: titleFromValue(value, `${fallbackLabel} ${index + 1}`),
   detail: detailFromValue(value),
  })),
 };
}

function collectArrays(
 record: Record<string, unknown>,
 keys: string[],
): unknown[] {
 return keys.flatMap((key) => arrayValue(record, key));
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
    ...collectArrays(sectionRecord, ["lesson_parts"]),
    ...collectArrays(embeddedSummary, ["lesson_parts"]),
    ...collectArrays(contentSummary, ["lesson_parts"]),
   ],
   "Phần",
  ),
  groupFromArray(
   section.id,
   "grammar-points",
   "Điểm ngữ pháp",
   [
    ...collectArrays(sectionRecord, ["grammar_points"]),
    ...collectArrays(embeddedSummary, ["grammar_points"]),
    ...collectArrays(contentSummary, ["grammar_points"]),
   ],
   "Ngữ pháp",
  ),
  groupFromArray(
   section.id,
   "patterns",
   "Mẫu câu / câu trọng tâm",
   [
    ...collectArrays(sectionRecord, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
    ...collectArrays(embeddedSummary, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
    ...collectArrays(contentSummary, [
     "key_patterns",
     "key_sentence_patterns",
     "key_sentences",
     "main_patterns",
    ]),
   ],
   "Câu",
  ),
  groupFromArray(
   section.id,
   "exercise-types",
   "Dạng bài tập",
   [
    ...collectArrays(sectionRecord, ["exercise_types"]),
    ...collectArrays(embeddedSummary, ["exercise_types"]),
    ...collectArrays(contentSummary, ["exercise_types"]),
   ],
   "Dạng",
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

function SummarySectionView({
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
 const hasLooseItems = looseItems.some(hasRenderableValue);

 if (!hasGroups && !hasLooseItems) {
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

   {hasLooseItems && (
    <LooseItemGrid items={looseItems} displayMode={displayMode} />
   )}
  </div>
 );
}

function RawItemDetails({ value }: { value: unknown }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của mục này
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}

function stringList(value: unknown) {
 if (!Array.isArray(value)) return [];

 return value.filter(
  (entry): entry is string =>
   typeof entry === "string" && Boolean(entry.trim()),
 );
}

function properNounBackText(record: Record<string, unknown>) {
 const flashcard = asRecord(record.flashcard);

 return (
  stringValue(record, "meaning_vi") ||
  stringValue(record, "vi") ||
  stringValue(record, "meaning_en") ||
  stringValue(flashcard, "back")
 );
}

function properNounFrontText(record: Record<string, unknown>) {
 const flashcard = asRecord(record.flashcard);

 return (
  stringValue(record, "hanzi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "title") ||
  stringValue(flashcard, "front")
 );
}

function ProperNounCard({
 item,
 displayMode,
 debugMode,
}: {
 item: unknown;
 displayMode: LessonDisplayMode;
 debugMode: boolean;
}) {
 const record = asRecord(item);
 const flashcard = asRecord(record.flashcard);

 const hanzi = properNounFrontText(record);
 const pinyin = stringValue(record, "pinyin");
 const meaning = properNounBackText(record);
 const pos = stringValue(record, "pos");
 const posDetail = asRecord(record.pos_detail);
 const posDetailVi = stringValue(posDetail, "vi");
 const tags = stringList(record.tags);
 const modes = stringList(flashcard.modes);

 return (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div className="grid gap-1">
    {hanzi && (
     <h4
      className="text-2xl font-black leading-none text-text-primary"
      lang="zh-CN"
     >
      {hanzi}
     </h4>
    )}

    {displayMode.showPinyin && pinyin && (
     <p className="text-sm font-black text-primary">{pinyin}</p>
    )}

    {displayMode.showMeaning && meaning && (
     <p className="text-sm font-semibold leading-relaxed text-text-secondary">
      {meaning}
     </p>
    )}
   </div>

   {(pos || posDetailVi) && (
    <div className="flex flex-wrap gap-2">
     {pos && (
      <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
       {pos}
      </span>
     )}

     {posDetailVi && posDetailVi !== pos && (
      <span className="rounded-full border border-border-default bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
       {posDetailVi}
      </span>
     )}
    </div>
   )}

   {tags.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {tags.map((tag) => (
      <span
       key={tag}
       className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-black text-accent-text"
      >
       {tag.replaceAll("_", " ")}
      </span>
     ))}
    </div>
   )}

   {modes.length > 0 && (
    <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
     <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
      Flashcard modes
     </summary>
     <div className="mt-2 flex flex-wrap gap-2">
      {modes.map((mode) => (
       <span
        key={mode}
        className="rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-black text-text-muted"
       >
        {mode.replaceAll("_", " → ")}
       </span>
      ))}
     </div>
    </details>
   )}

   {debugMode && <RawItemDetails value={item} />}
  </article>
 );
}

function RawSectionDetails({ section }: { section: Section }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của section
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(section, null, 2)}
   </pre>
  </details>
 );
}

function SectionContentFrame({
 lessonId,
 section,
 sectionPath,
 debugMode,
 children,
}: {
 lessonId?: string;
 section: Section;
 sectionPath?: DraftPatchPath;
 debugMode: boolean;
 children: React.ReactNode;
}) {
 const content = (
  <div className="grid gap-3">
   {children}
   {debugMode && <RawSectionDetails section={section} />}
  </div>
 );

 if (!lessonId || !sectionPath) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="section"
   entityId={section.id}
   path={sectionPath}
   value={section}
   label={section.title_vi || section.title}
  >
   {content}
  </EditableNodeWrapper>
 );
}

export function BookSectionContent({
 lessonId,
 section,
 sectionPath,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
 debugMode = false,
}: {
 lessonId?: string;
 section: Section;
 sectionPath?: DraftPatchPath;
 displayMode?: LessonDisplayMode;
 debugMode?: boolean;
}) {
 const renderSectionFallback = () =>
  hasRenderableValue(section) ? (
   <GenericItemCard value={section} displayMode={displayMode} />
  ) : (
   <EmptySectionState reason={sectionEmptyReason(section)} />
  );

 if (section.type === "text") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.blocks.length > 0 ? (
     <div className="grid gap-3">
      {section.blocks.map((block, index) => (
       <TextBlockView
        key={block.id}
        lessonId={lessonId}
        block={block}
        path={sectionPath ? [...sectionPath, "blocks", index] : undefined}
        displayMode={displayMode}
       />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "vocabulary") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <VocabMiniGrid
      lessonId={lessonId}
      parentSectionId={section.id}
      itemsPath={sectionPath ? [...sectionPath, "items"] : undefined}
      items={section.items}
      displayMode={displayMode}
     />
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "notes") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-3">
      {section.items.map((item) => (
       <NoteCard key={item.id} item={item} displayMode={displayMode} />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "grammar") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-3">
      {section.items.map((item, index) => (
       <GrammarCard
        key={item.id}
        lessonId={lessonId}
        parentSectionId={section.id}
        path={sectionPath ? [...sectionPath, "items", index] : undefined}
        item={item}
        displayMode={displayMode}
       />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "exercises") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
      <div className="grid gap-2">
      {section.items.map((item, index) => (
       <ExerciseCard
        key={item.id}
        lessonId={lessonId}
        parentSectionId={section.id}
        path={sectionPath ? [...sectionPath, "items", index] : undefined}
        item={item}
        displayMode={displayMode}
        debugMode={debugMode}
       />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "reading") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-2">
      {section.items.map((item, index) => (
       <ReadingCard
        key={item.id}
        lessonId={lessonId}
        parentSectionId={section.id}
        path={sectionPath ? [...sectionPath, "items", index] : undefined}
        item={item}
        displayMode={displayMode}
       />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "character_writing") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-2 md:grid-cols-3">
      {section.items.map((item, index) => (
       <WritingCard
        key={item.id}
        lessonId={lessonId}
        parentSectionId={section.id}
        path={sectionPath ? [...sectionPath, "items", index] : undefined}
        item={item}
        displayMode={displayMode}
       />
      ))}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "summary") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    <SummarySectionView section={section} displayMode={displayMode} />
   </SectionContentFrame>
  );
 }

 const sectionRecord = asRecord(section);
 const looseItems = [
  ...arrayValue(sectionRecord, "items"),
  ...arrayValue(sectionRecord, "blocks"),
 ];

 if (section.type === "communication") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {section.items.length > 0 ? (
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
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "proper_nouns") {
  return (
   <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
    {looseItems.length > 0 ? (
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {looseItems.map((item, index) => {
       const itemId =
        stringValue(asRecord(item), "id") || `${section.id}-${index}`;
       const card = (
        <ProperNounCard
         item={item}
         displayMode={displayMode}
         debugMode={debugMode}
        />
       );

       return lessonId && sectionPath ? (
        <EditableNodeWrapper
         key={itemId}
         lessonId={lessonId}
         entityType="proper_noun"
         entityId={itemId}
         parentEntityType="section"
         parentEntityId={section.id}
         path={[...sectionPath, "items", index]}
         value={item}
         label={properNounFrontText(asRecord(item))}
        >
         {card}
        </EditableNodeWrapper>
       ) : (
        <div key={itemId}>{card}</div>
       );
      })}
     </div>
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 return (
  <SectionContentFrame lessonId={lessonId} section={section} sectionPath={sectionPath} debugMode={debugMode}>
   {looseItems.length > 0 ? (
    <div className="grid gap-2">
     {looseItems.map((item, index) => (
      <GenericItemCard
       key={stringValue(asRecord(item), "id") || `${index}`}
       value={item}
       displayMode={displayMode}
      />
     ))}
    </div>
   ) : (
    renderSectionFallback()
   )}
  </SectionContentFrame>
 );
}
