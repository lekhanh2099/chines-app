import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { BookOpen } from "lucide-react";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { renderHighlightedVocabText } from "./renderHighlightedVocabText";

export function StructuredExamplesSection({
 item,
 lessonId,
 itemPath,
 keyword,
}: {
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: EditableNodePath;
 keyword: string;
}) {
 return (
  <section
   id="vocab-examples"
   className="grid gap-4 rounded-2xl border border-border-default bg-bg-card p-4 shadow-theme-sm"
  >
   <Typography
    as="h3"
    variant="cardTitle"
    tone="default"
    weight="black"
    className="flex items-center gap-2"
   >
    <BookOpen className="h-5 w-5 text-accent-text" />
    Ví dụ
   </Typography>

   <div className="grid gap-3">
    {item.examples.map((example, index) => {
     const content = (
      <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
       <div className="grid gap-1">
        <StudyInstructionText variant="pageTitle" tone="default" weight="black" leading="relaxed">
         {renderHighlightedVocabText(example.zh, keyword)}
        </StudyInstructionText>
        {example.pinyin && (
         <StudyInstructionText tone="muted" weight="bold" leading="relaxed" emphasis="italic">
          {example.pinyin}
         </StudyInstructionText>
        )}
        <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
         {example.vi}
        </StudyInstructionText>
       </div>

       {example.analysis_vi && (
        <StudyInstructionText
         tone="accent"
         leading="relaxed"
         className="border-t border-border-default pt-3"
        >
         {example.analysis_vi}
        </StudyInstructionText>
       )}
      </div>
     );

     if (!lessonId || !itemPath || !example.id) {
      return <div key={example.id || index}>{content}</div>;
     }

     return (
      <EditableNodeWrapper
       key={example.id}
       lessonId={lessonId}
       entityType="vocab_example"
       entityId={example.id}
       parentEntityType="vocab_item"
       parentEntityId={getVocabItemKey(item)}
       path={[...itemPath, "examples", index]}
       value={example}
       label={example.zh}
      >
       {content}
      </EditableNodeWrapper>
     );
    })}
   </div>
  </section>
 );
}
