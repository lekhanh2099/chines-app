import { Card } from "@/components/ui/card";
import type { TextBlock } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import { TextLineCard } from "./TextLineCard";
import { ReaderHanziText, StudyInstructionText } from "./hanzi-typography";
import type { LessonDisplayMode } from "./types";

export function TextBlockView({
 lessonId,
 block,
 path,
 displayMode,
 interactiveReading = false,
 readingMode = false,
 documentMode = false,
}: {
 lessonId?: string;
 block: TextBlock;
 path?: EditableNodePath;
 displayMode: LessonDisplayMode;
 interactiveReading?: boolean;
 readingMode?: boolean;
 documentMode?: boolean;
}) {
 const directLines = block.lines;
 const narrativeParagraphs = block.type === "text_narrative" ? block.paragraphs : [];
 const dialogueScenes = block.type === "text_dialogue" ? block.scenes : [];
 const shouldRenderDirectLines =
  directLines.length > 0 && (block.type !== "text_narrative" || narrativeParagraphs.length === 0);

 const content = (
  <section className="grid gap-3 sm:gap-4">
   <div className="grid gap-1">
    <ReaderHanziText as="h4" displayMode={displayMode} size="lg" leading="relaxed">
     {block.title}
    </ReaderHanziText>
    {displayMode.showMeaning && block.title_vi && block.title_vi !== block.title ? (
     <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold">
      {block.title_vi}
     </StudyInstructionText>
    ) : null}
   </div>

   {shouldRenderDirectLines ? (
    <div>
     {directLines.map((line, index) => {
      const card = (
       <TextLineCard
        speaker={line.speaker}
        zh={line.zh}
        pinyin={line.pinyin}
        vi={line.vi}
        displayMode={displayMode}
        interactiveReading={interactiveReading}
        readingMode={readingMode}
        variant="reader"
        annotationTarget={
         lessonId ? { lessonId, nodeType: "text_line", nodeId: line.id } : undefined
        }
       />
      );

      return lessonId && path ? (
       <EditableNodeWrapper
        key={line.id}
        lessonId={lessonId}
        entityType="text_line"
        entityId={line.id}
        parentEntityType="text_block"
        parentEntityId={block.id}
        path={[...path, "lines", index]}
        value={line}
        label={line.speaker || line.zh}
       >
        {card}
       </EditableNodeWrapper>
      ) : (
       <div key={line.id}>{card}</div>
      );
     })}
    </div>
   ) : null}

   {dialogueScenes.map((scene, sceneIndex) => (
    <Card key={scene.id} variant="subtle" padding="md" className="grid gap-2">
     {scene.summary_vi ? (
      <StudyInstructionText tone="muted" weight="bold">
       {scene.summary_vi}
      </StudyInstructionText>
     ) : null}
     {scene.lines.map((line, lineIndex) => {
      const card = (
       <TextLineCard
        speaker={line.speaker}
        zh={line.zh}
        pinyin={line.pinyin}
        vi={line.vi}
        displayMode={displayMode}
        interactiveReading={interactiveReading}
        readingMode={readingMode}
        variant="reader"
        annotationTarget={
         lessonId ? { lessonId, nodeType: "text_line", nodeId: line.id } : undefined
        }
       />
      );

      return lessonId && path ? (
       <EditableNodeWrapper
        key={line.id}
        lessonId={lessonId}
        entityType="text_line"
        entityId={line.id}
        parentEntityType="text_block"
        parentEntityId={block.id}
        path={[...path, "scenes", sceneIndex, "lines", lineIndex]}
        value={line}
        label={line.speaker || line.zh}
       >
        {card}
       </EditableNodeWrapper>
      ) : (
       <div key={line.id}>{card}</div>
      );
     })}
    </Card>
   ))}

   {narrativeParagraphs.length > 0 ? (
    <div>
     {narrativeParagraphs.map((paragraph, index) => {
      const card = (
       <TextLineCard
        zh={paragraph.zh}
        pinyin={paragraph.pinyin}
        vi={paragraph.vi}
        displayMode={displayMode}
        interactiveReading={interactiveReading}
        readingMode={readingMode}
        variant="reader"
        annotationTarget={
         lessonId ? { lessonId, nodeType: "text_paragraph", nodeId: paragraph.id } : undefined
        }
       />
      );

      return lessonId && path ? (
       <EditableNodeWrapper
        key={paragraph.id}
        lessonId={lessonId}
        entityType="text_paragraph"
        entityId={paragraph.id}
        parentEntityType="text_block"
        parentEntityId={block.id}
        path={[...path, "paragraphs", index]}
        value={paragraph}
        label={paragraph.zh}
       >
        {card}
       </EditableNodeWrapper>
      ) : (
       <div key={paragraph.id}>{card}</div>
      );
     })}
    </div>
   ) : null}
  </section>
 );

 const renderedContent = documentMode ? (
  content
 ) : (
  <Card asChild variant="section" padding="md">
   {content}
  </Card>
 );

 if (!lessonId || !path) return renderedContent;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="text_block"
   entityId={block.id}
   path={path}
   value={block}
   label={block.title_vi || block.title}
   editLabel="Sửa nội dung"
  >
   {renderedContent}
  </EditableNodeWrapper>
 );
}
