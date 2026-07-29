import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { WordFormation } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function WordFormationDetailSection({ formation }: { formation: WordFormation }) {
 return (
  <VocabReadingSection id="vocab-word-formation" title="Logic / cấu tạo">
   {formation.word_logic_vi && (
    <StudyInstructionText>{formation.word_logic_vi}</StudyInstructionText>
   )}
   {formation.memory_tip_vi && (
    <StudyInstructionText>Mẹo nhớ: {formation.memory_tip_vi}</StudyInstructionText>
   )}
   {formation.warning_vi && (
    <StudyInstructionText>Lưu ý: {formation.warning_vi}</StudyInstructionText>
   )}
   {formation.notes.map((note) => (
    <StudyInstructionText key={note.text_vi}>{note.text_vi}</StudyInstructionText>
   ))}
  </VocabReadingSection>
 );
}
