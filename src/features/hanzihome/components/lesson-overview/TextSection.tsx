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
}: {
 lessonId?: string;
 block: TextBlock;
 path?: EditableNodePath;
 displayMode: LessonDisplayMode;
}) {
 const directLines = block.lines;
 const narrativeParagraphs = block.type === "text_narrative" ? block.paragraphs : [];
 const dialogueScenes = block.type === "text_dialogue" ? block.scenes : [];
 const shouldRenderDirectLines =
  directLines.length > 0 && (block.type !== "text_narrative" || narrativeParagraphs.length === 0);

 const content = (
  <section className="exercise-card-surface grid gap-3 rounded-lg border px-3 py-3 sm:gap-4 sm:px-4">
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

   {shouldRenderDirectLines && (
    <div className="rounded-lg bg-bg-card sm:px-4">
     {directLines.map((line, index) => {
      const card = (
       <TextLineCard
        speaker={line.speaker}
        zh={line.zh}
        pinyin={line.pinyin}
        vi={line.vi}
        displayMode={displayMode}
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
   )}

   {dialogueScenes.map((scene, sceneIndex) => (
    <div
     key={scene.id}
     className="exercise-question-surface grid gap-2 rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3"
    >
     {scene.summary_vi && (
      <StudyInstructionText tone="muted" weight="bold">
       {scene.summary_vi}
      </StudyInstructionText>
     )}
     {scene.lines.map((line, lineIndex) => {
      const card = (
       <TextLineCard
        speaker={line.speaker}
        zh={line.zh}
        pinyin={line.pinyin}
        vi={line.vi}
        displayMode={displayMode}
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
    </div>
   ))}

   {narrativeParagraphs.length > 0 && (
    <div className="exercise-question-surface rounded-lg border px-3 sm:px-4">
     {narrativeParagraphs.map((paragraph, index) => {
      const card = (
       <TextLineCard
        zh={paragraph.zh}
        pinyin={paragraph.pinyin}
        vi={paragraph.vi}
        displayMode={displayMode}
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
   )}
  </section>
 );

 if (!lessonId || !path) return content;

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
   {content}
  </EditableNodeWrapper>
 );
}
