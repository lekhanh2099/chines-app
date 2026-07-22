import type { Collocation } from "@/features/hanzihome/schemas/vocab.types";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { VocabReadingSection } from "./VocabReadingSection";

export function CollocationSection({
 collocations,
 item,
 lessonId,
 itemPath,
 section,
}: {
 collocations: Collocation[];
 item: HanziHomeVocabItem;
 lessonId?: string;
 itemPath?: EditableNodePath;
 section?: NonNullable<HanziHomeVocabItem["detailSections"]>[number];
}) {
 const content = (
  <VocabReadingSection id="vocab-collocations" title="Kết hợp thường gặp">
   <div className="grid gap-2">
    {collocations.map((collocation, index) => (
     <div key={collocation.id || index}>
      <div className="rounded-xl border border-border-default bg-bg-primary p-3">
       <p className="font-black text-text-primary">{collocation.zh}</p>
       {collocation.pinyin && <p className="italic text-text-muted">{collocation.pinyin}</p>}
       {collocation.vi && <p>{collocation.vi}</p>}
       {collocation.pattern && (
        <p className="font-semibold text-accent-text">{collocation.pattern}</p>
       )}
       {collocation.note_vi && <p className="text-text-muted">{collocation.note_vi}</p>}
      </div>
     </div>
    ))}
   </div>
  </VocabReadingSection>
 );

 if (!lessonId || !itemPath || !section) return content;
 const sectionIndex = item.detailSections?.findIndex((entry) => entry.id === section.id) ?? -1;
 if (sectionIndex < 0) return content;

 return (
  <EditableNodeWrapper
   lessonId={lessonId}
   entityType="vocab_detail_section"
   entityId={section.id}
   parentEntityType="vocab_item"
   parentEntityId={getVocabItemKey(item)}
   path={[...itemPath, "detailSections", sectionIndex]}
   value={section}
   label={section.title}
   editLabel="Sửa cả section"
  >
   {content}
  </EditableNodeWrapper>
 );
}
