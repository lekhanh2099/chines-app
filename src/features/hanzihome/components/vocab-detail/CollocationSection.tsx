import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
       <StudyInstructionText tone="default" weight="black">
        {collocation.zh}
       </StudyInstructionText>
       {collocation.pinyin && (
        <StudyInstructionText tone="muted" emphasis="italic">
         {collocation.pinyin}
        </StudyInstructionText>
       )}
       {collocation.vi && <StudyInstructionText>{collocation.vi}</StudyInstructionText>}
       {collocation.pattern && (
        <StudyInstructionText tone="accent" weight="semibold">
         {collocation.pattern}
        </StudyInstructionText>
       )}
       {collocation.note_vi && (
        <StudyInstructionText tone="muted">{collocation.note_vi}</StudyInstructionText>
       )}
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
