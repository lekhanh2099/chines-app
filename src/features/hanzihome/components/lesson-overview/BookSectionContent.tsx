import type { ReadingItem, Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { EmptySectionState, GenericItemCard, hasRenderableValue } from "./CommonCards";
import { ExerciseCard } from "./ExerciseSection";
import { GrammarCard } from "./GrammarSection";
import { NoteCard } from "./NotesSection";
import { ReadingCard } from "./ReadingSection";
import { TextSectionView } from "./TextSection";
import { ProperNounCard } from "./book-section/ProperNounCard";
import { PreparationSectionView } from "./book-section/PreparationSectionView";
import { SectionContentFrame } from "./book-section/SectionContentFrame";
import { SummarySectionView } from "./book-section/SummarySectionView";
import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
import { VocabMiniGrid } from "./VocabularySection";
import { WritingCard } from "./WritingSection";
import { arrayValue, asRecord, sectionEmptyReason, stringValue } from "./utils";

export function BookSectionContent({
 lessonId,
 section,
 displayMode = DEFAULT_LESSON_DISPLAY_MODE,
 debugMode = false,
 readingItems,
 readingSections,
}: {
 lessonId?: string;
 section: Section;
 displayMode?: LessonDisplayMode;
 debugMode?: boolean;
 readingItems?: readonly ReadingItem[];
 readingSections?: readonly Section[];
 interactiveReading?: boolean;
 readingMode?: boolean;
 documentMode?: boolean;
}) {
 const renderSectionFallback = () =>
  hasRenderableValue(section) ? (
   <GenericItemCard value={section} displayMode={displayMode} debugMode={debugMode} />
  ) : (
   <EmptySectionState reason={sectionEmptyReason(section)} />
  );

 if (section.type === "text") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.blocks.length > 0 ? (
     <TextSectionView lessonId={lessonId} section={section} displayMode={displayMode} />
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "vocabulary") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <VocabMiniGrid items={section.items} displayMode={displayMode} />
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "notes") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-3">
      {section.items.map((item) => (
       <NoteCard key={item.id} item={item} displayMode={displayMode} lessonId={lessonId} />
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
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-3">
      {section.items.map((item) => (
       <GrammarCard key={item.id} lessonId={lessonId} item={item} displayMode={displayMode} />
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
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-4">
      {section.items.map((item) => (
       <ExerciseCard
        key={item.id}
        item={item}
        displayMode={displayMode}
        debugMode={debugMode}
        readingItems={readingItems}
        readingSections={readingSections}
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
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-2">
      {section.items.map((item) => (
       <ReadingCard
        key={item.id}
        lessonId={lessonId}
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

 if (section.type === "character_writing") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <div className="grid gap-2 md:grid-cols-3">
      {section.items.map((item) => (
       <WritingCard key={item.id} item={item} displayMode={displayMode} />
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
   <SectionContentFrame section={section} debugMode={debugMode}>
    <SummarySectionView section={section} displayMode={displayMode} />
   </SectionContentFrame>
  );
 }

 const sectionRecord = asRecord(section);
 const looseItems = [...arrayValue(sectionRecord, "items"), ...arrayValue(sectionRecord, "blocks")];

 if (section.type === "communication") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {section.items.length > 0 ? (
     <PreparationSectionView
      items={section.items}
      displayMode={displayMode}
      debugMode={debugMode}
     />
    ) : (
     renderSectionFallback()
    )}
   </SectionContentFrame>
  );
 }

 if (section.type === "proper_nouns") {
  return (
   <SectionContentFrame section={section} debugMode={debugMode}>
    {looseItems.length > 0 ? (
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {looseItems.map((item, index) => {
       const itemId = stringValue(asRecord(item), "id") || `${section.id}-${index}`;
       const card = <ProperNounCard item={item} displayMode={displayMode} debugMode={debugMode} />;
       // The lesson workspace renders cards directly; read-only previews keep a grid cell.
       return lessonId ? (
        <ProperNounCard key={itemId} item={item} displayMode={displayMode} debugMode={debugMode} />
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
  <SectionContentFrame section={section} debugMode={debugMode}>
   {looseItems.length > 0 ? (
    <div className="grid gap-2">
     {looseItems.map((item, index) => (
      <GenericItemCard
       key={stringValue(asRecord(item), "id") || `${index}`}
       value={item}
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
