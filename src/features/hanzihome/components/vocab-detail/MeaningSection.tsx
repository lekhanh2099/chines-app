import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { Meaning } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function MeaningSection({ meaning }: { meaning: Meaning }) {
 return (
  <VocabReadingSection id="vocab-meaning" title="Nghĩa">
   <div className="grid gap-2">
    {meaning.short_definition_vi && (
     <StudyInstructionText variant="sectionTitle" tone="default" weight="black">
      {meaning.short_definition_vi}
     </StudyInstructionText>
    )}
    <StudyInstructionText>{meaning.meaning_vi}</StudyInstructionText>
    {meaning.natural_translations_vi.length > 0 && (
     <StudyInstructionText>
      Tự nhiên: {meaning.natural_translations_vi.join(", ")}
     </StudyInstructionText>
    )}
    {meaning.textbook_focus_vi && (
     <StudyInstructionText>{meaning.textbook_focus_vi}</StudyInstructionText>
    )}
    {meaning.register_vi && (
     <StudyInstructionText>Sắc thái: {meaning.register_vi}</StudyInstructionText>
    )}
    {meaning.usage_domain_vi && (
     <StudyInstructionText>Phạm vi dùng: {meaning.usage_domain_vi}</StudyInstructionText>
    )}
    {meaning.notes.map((note) => (
     <StudyInstructionText key={note.text_vi}>{note.text_vi}</StudyInstructionText>
    ))}
   </div>
  </VocabReadingSection>
 );
}
