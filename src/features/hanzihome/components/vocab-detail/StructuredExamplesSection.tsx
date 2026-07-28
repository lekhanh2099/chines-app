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
   <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
    <BookOpen className="h-5 w-5 text-accent-text" />
    Ví dụ
   </h3>

   <div className="grid gap-3">
    {item.examples.map((example, index) => {
     const content = (
      <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
       <div className="grid gap-1">
        <p className="text-2xl font-black leading-relaxed text-text-primary">
         {renderHighlightedVocabText(example.zh, keyword)}
        </p>
        {example.pinyin && (
         <p className="font-bold italic leading-relaxed text-text-muted">{example.pinyin}</p>
        )}
        <p className="font-semibold leading-relaxed text-text-secondary">{example.vi}</p>
       </div>

       {example.analysis_vi && (
        <p className="border-t border-border-default pt-3 leading-relaxed text-accent-text">
         {example.analysis_vi}
        </p>
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
