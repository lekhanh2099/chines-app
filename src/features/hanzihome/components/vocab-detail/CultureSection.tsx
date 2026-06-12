import type { CultureNote } from "@/features/hanzihome/static-json/schemas/vocab.schema";
import { VocabReadingSection } from "./VocabReadingSection";

export function CultureSection({ culture }: { culture: CultureNote | undefined }) {
 if (!culture) return null;

 return (
  <VocabReadingSection id="vocab-culture" title={culture.title || "Văn hóa"}>
   {culture.content_vi && <p>{culture.content_vi}</p>}
  </VocabReadingSection>
 );
}
