import type { Collocation } from "@/features/hanzihome/static-json/schemas/vocab.schema";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { VocabReadingSection } from "./VocabReadingSection";

export function CollocationSection({
 collocations,
 item,
 lessonId,
 itemPath,
}: {
 collocations: Collocation[];
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: EditableNodePath;
}) {
 return (
  <VocabReadingSection id="vocab-collocations" title="Kết hợp thường gặp">
   <div className="grid gap-2">
    {collocations.map((collocation, index) => {
     const content = (
      <div className="rounded-xl border border-border-default bg-bg-primary p-3">
       <p className="font-black text-text-primary">{collocation.zh}</p>
       {collocation.pinyin && <p className="italic text-text-muted">{collocation.pinyin}</p>}
       {collocation.vi && <p>{collocation.vi}</p>}
       {collocation.pattern && (
        <p className="font-semibold text-accent-text">{collocation.pattern}</p>
       )}
       {collocation.note_vi && <p className="text-text-muted">{collocation.note_vi}</p>}
      </div>
     );

     if (!lessonId || !itemPath || !collocation.id) {
      return <div key={collocation.id || index}>{content}</div>;
     }

     return (
      <EditableNodeWrapper
       key={collocation.id}
       lessonId={lessonId}
       entityType="vocab_detail_section"
       entityId={collocation.id}
       parentEntityType="vocab_item"
       parentEntityId={getVocabItemKey(item)}
       path={[...itemPath, "collocations", index]}
       value={collocation}
       label={collocation.zh}
      >
       {content}
      </EditableNodeWrapper>
     );
    })}
   </div>
  </VocabReadingSection>
 );
}
