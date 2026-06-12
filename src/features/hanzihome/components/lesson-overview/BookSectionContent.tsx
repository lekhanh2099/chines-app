import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

import { EmptySectionState, GenericItemCard, hasRenderableValue } from "./CommonCards";
import { ExerciseCard } from "./ExerciseSection";
import { GrammarCard } from "./GrammarSection";
import { NoteCard } from "./NotesSection";
import { ReadingCard } from "./ReadingSection";
import { TextBlockView } from "./TextSection";
import { ProperNounCard } from "./book-section/ProperNounCard";
import { SectionContentFrame } from "./book-section/SectionContentFrame";
import { SummarySectionView } from "./book-section/SummarySectionView";
import { properNounFrontText } from "./book-section/proper-noun-utils";
import { DEFAULT_LESSON_DISPLAY_MODE, type LessonDisplayMode } from "./types";
import { VocabMiniGrid } from "./VocabularySection";
import { WritingCard } from "./WritingSection";
import { arrayValue, asRecord, sectionEmptyReason, stringValue } from "./utils";

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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
    <SummarySectionView section={section} displayMode={displayMode} />
   </SectionContentFrame>
  );
 }

 const sectionRecord = asRecord(section);
 const looseItems = [...arrayValue(sectionRecord, "items"), ...arrayValue(sectionRecord, "blocks")];

 if (section.type === "communication") {
  return (
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
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
   <SectionContentFrame
    lessonId={lessonId}
    section={section}
    sectionPath={sectionPath}
    debugMode={debugMode}
   >
    {looseItems.length > 0 ? (
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {looseItems.map((item, index) => {
       const itemId = stringValue(asRecord(item), "id") || `${section.id}-${index}`;
       const card = <ProperNounCard item={item} displayMode={displayMode} debugMode={debugMode} />;

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
  <SectionContentFrame
   lessonId={lessonId}
   section={section}
   sectionPath={sectionPath}
   debugMode={debugMode}
  >
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
