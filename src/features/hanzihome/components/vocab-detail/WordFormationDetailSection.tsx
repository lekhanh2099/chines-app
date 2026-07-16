import type { WordFormation } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function WordFormationDetailSection({ formation }: { formation: WordFormation }) {
 return (
  <VocabReadingSection id="vocab-word-formation" title="Logic / cấu tạo">
   {formation.word_logic_vi && <p>{formation.word_logic_vi}</p>}
   {formation.memory_tip_vi && <p>Mẹo nhớ: {formation.memory_tip_vi}</p>}
   {formation.warning_vi && <p>Lưu ý: {formation.warning_vi}</p>}
   {formation.notes.map((note) => (
    <p key={note.text_vi}>{note.text_vi}</p>
   ))}
  </VocabReadingSection>
 );
}
