import type { Meaning } from "@/features/hanzihome/static-json/schemas/vocab.schema";
import { VocabReadingSection } from "./VocabReadingSection";

export function MeaningSection({ meaning }: { meaning: Meaning }) {
 return (
  <VocabReadingSection id="vocab-meaning" title="Nghĩa">
   <div className="grid gap-2">
    {meaning.short_definition_vi && (
     <p className="text-lg font-black text-text-primary">{meaning.short_definition_vi}</p>
    )}
    <p>{meaning.meaning_vi}</p>
    {meaning.natural_translations_vi.length > 0 && (
     <p>Tự nhiên: {meaning.natural_translations_vi.join(", ")}</p>
    )}
    {meaning.textbook_focus_vi && <p>{meaning.textbook_focus_vi}</p>}
    {meaning.register_vi && <p>Sắc thái: {meaning.register_vi}</p>}
    {meaning.usage_domain_vi && <p>Phạm vi dùng: {meaning.usage_domain_vi}</p>}
    {meaning.notes.map((note) => (
     <p key={note.text_vi}>{note.text_vi}</p>
    ))}
   </div>
  </VocabReadingSection>
 );
}
