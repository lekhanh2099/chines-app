import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { Collocation } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function CollocationSection({ collocations }: { collocations: Collocation[] }) {
 return (
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
}
