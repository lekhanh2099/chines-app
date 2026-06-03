import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import {
 EmptySectionState,
 GenericItemCard,
 LooseItemGrid,
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

function buildSummaryItems(section: Section) {
 const sectionRecord = asRecord(section);
 const embeddedSummary = asRecord(sectionRecord.summary);
 const contentSummary = asRecord(sectionRecord.content);

 return [
  ...arrayValue(sectionRecord, "lesson_parts").map((title, index) => ({
   id: `${section.id}-lesson-part-${index}`,
   title: typeof title === "string" ? title : `Phần ${index + 1}`,
  })),
  ...arrayValue(sectionRecord, "grammar_points"),
  ...arrayValue(sectionRecord, "key_patterns").map((title, index) => ({
   id: `${section.id}-key-pattern-${index}`,
   title: typeof title === "string" ? title : `Mẫu câu ${index + 1}`,
  })),
  ...arrayValue(sectionRecord, "key_sentence_patterns").map((title, index) => ({
   id: `${section.id}-key-sentence-pattern-${index}`,
   title: typeof title === "string" ? title : `Mẫu câu ${index + 1}`,
  })),
  ...arrayValue(sectionRecord, "key_sentences").map((title, index) => ({
   id: `${section.id}-key-sentence-${index}`,
   title: typeof title === "string" ? title : `Câu ${index + 1}`,
  })),
  ...arrayValue(embeddedSummary, "lesson_parts").map((title, index) => ({
   id: `${section.id}-summary-lesson-part-${index}`,
   title: typeof title === "string" ? title : `Phần ${index + 1}`,
  })),
  ...arrayValue(embeddedSummary, "grammar_points"),
  ...arrayValue(embeddedSummary, "key_patterns").map((title, index) => ({
   id: `${section.id}-summary-key-pattern-${index}`,
   title: typeof title === "string" ? title : `Mẫu câu ${index + 1}`,
  })),
  ...arrayValue(embeddedSummary, "key_sentences").map((title, index) => ({
   id: `${section.id}-summary-key-sentence-${index}`,
   title: typeof title === "string" ? title : `Câu ${index + 1}`,
  })),
  ...arrayValue(contentSummary, "lesson_parts").map((title, index) => ({
   id: `${section.id}-content-lesson-part-${index}`,
   title: typeof title === "string" ? title : `Phần ${index + 1}`,
  })),
  ...arrayValue(contentSummary, "grammar_points"),
  ...arrayValue(contentSummary, "key_patterns").map((title, index) => ({
   id: `${section.id}-content-key-pattern-${index}`,
   title: typeof title === "string" ? title : `Mẫu câu ${index + 1}`,
  })),
  ...arrayValue(contentSummary, "key_sentences").map((title, index) => ({
   id: `${section.id}-content-key-sentence-${index}`,
   title: typeof title === "string" ? title : `Câu ${index + 1}`,
  })),
 ];
}

export function BookSectionContent({
 section,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
}: {
 section: Section;
 displayMode?: LessonDisplayMode;
}) {
 if (section.type === "text") {
  return section.blocks.length > 0 ? (
   <div className="grid gap-3">
    {section.blocks.map((block) => (
     <TextBlockView key={block.id} block={block} displayMode={displayMode} />
    ))}
   </div>
  ) : (
   <EmptySectionState reason={sectionEmptyReason(section)} />
  );
 }

 if (section.type === "vocabulary") {
  return section.items.length > 0 ? (
   <VocabMiniGrid items={section.items} displayMode={displayMode} />
  ) : (
   <EmptySectionState reason={sectionEmptyReason(section)} />
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
   <EmptySectionState reason={sectionEmptyReason(section)} />
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
   <EmptySectionState reason={sectionEmptyReason(section)} />
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
   <EmptySectionState reason={sectionEmptyReason(section)} />
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
   <EmptySectionState reason={sectionEmptyReason(section)} />
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
   <EmptySectionState reason={sectionEmptyReason(section)} />
  );
 }

 const sectionRecord = asRecord(section);
 const looseItems = [
  ...arrayValue(sectionRecord, "items"),
  ...arrayValue(sectionRecord, "blocks"),
 ];
 const renderItems = [...looseItems, ...buildSummaryItems(section)];

 if (section.type === "proper_nouns" || section.type === "communication") {
  return (
   <LooseItemGrid
    items={renderItems}
    displayMode={displayMode}
    emptyReason={sectionEmptyReason(section)}
   />
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
  <EmptySectionState reason={sectionEmptyReason(section)} />
 );
}
