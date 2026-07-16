import type { WordFormation } from "@/features/hanzihome/schemas/vocab.types";
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
