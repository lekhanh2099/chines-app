import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import type { GrammarPoint } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";

import type { LessonDisplayMode } from "../types";
import { GrammarBlockView } from "./GrammarBlockView";

export function GrammarCard({
 lessonId,
 parentSectionId,
 path,
 item,
 displayMode,
}: {
 lessonId?: string;
 parentSectionId?: string;
 path?: EditableNodePath;
 item: GrammarPoint;
 displayMode: LessonDisplayMode;
}) {
 const content = (
  <article className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4">
   <div>
    <Typography as="h4" variant="cardTitle" tone="default" weight="black">
     {item.title_vi || item.title}
    </Typography>
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="bold"
     tracking="wide"
     transform="uppercase"
    >
     {item.title}
    </StudyInstructionText>
   </div>
   <div className="grid gap-2">
    {item.blocks.map((block, index) => (
     <GrammarBlockView
      key={block.id}
      lessonId={lessonId}
      grammarPointId={item.id}
      path={path ? [...path, "blocks", index] : undefined}
      block={block}
      displayMode={displayMode}
     />
    ))}
   </div>
  </article>
 );

 if (!lessonId || !path) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="grammar_point"
   entityId={item.id}
   parentEntityType="section"
   parentEntityId={parentSectionId}
   path={path}
   value={item}
   label={item.title_vi || item.title}
   editLabel="Sửa ngữ pháp"
  >
   {content}
  </EditableNodeWrapper>
 );
}
