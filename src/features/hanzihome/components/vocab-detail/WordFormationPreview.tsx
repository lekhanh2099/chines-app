import type { WordFormation } from "@/features/hanzihome/static-json/schemas/vocab.schema";
import { CharacterAnalysisCard } from "./CharacterAnalysisCard";

export function WordFormationPreview({ formation }: { formation: WordFormation }) {
 return (
  <div className="flex flex-wrap gap-3">
   {formation.characters.map((character) => (
    <CharacterAnalysisCard key={character.hanzi} character={character} />
   ))}
  </div>
 );
}
