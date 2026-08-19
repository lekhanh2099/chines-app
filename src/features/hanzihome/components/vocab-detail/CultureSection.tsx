import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { CultureNote } from "@/features/hanzihome/schemas/vocab.types";
import { VocabReadingSection } from "./VocabReadingSection";

export function CultureSection({ culture }: { culture?: CultureNote }) {
 if (!culture) return null;

 return (
  <VocabReadingSection id="vocab-culture" title={culture.title || "Văn hóa"}>
   {culture.content_vi && <StudyInstructionText>{culture.content_vi}</StudyInstructionText>}
  </VocabReadingSection>
 );
}
