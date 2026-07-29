import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Button } from "@/components/ui/button";
import type { CharacterAnalysis } from "@/features/hanzihome/schemas/vocab.types";

export function CharacterAnalysisCard({ character }: { character: CharacterAnalysis }) {
 return (
  <div className="grid max-w-2xs gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <div className="flex flex-wrap items-center gap-2">
    <StudyInstructionText variant="display" tone="default" weight="black" lang="zh-CN">
     {character.hanzi}
    </StudyInstructionText>
    {character.lishu_vi && (
     <StudyInstructionText as="span" tone="accent" weight="bold">
      {character.lishu_vi}
     </StudyInstructionText>
    )}
    {character.main_radical && (
     <Button variant="destructive" size="xs">
      {[
       character.main_radical.radical_name_vi,
       character.main_radical.radical_variant || character.main_radical.radical,
      ]
       .filter(Boolean)
       .join(" · ")}
     </Button>
    )}
   </div>

   {character.modern_meaning_vi && (
    <StudyInstructionText>{character.modern_meaning_vi}</StudyInstructionText>
   )}
   {character.modern_logic_vi && (
    <StudyInstructionText>{character.modern_logic_vi}</StudyInstructionText>
   )}
   {character.structure_note_vi && (
    <StudyInstructionText tone="muted">{character.structure_note_vi}</StudyInstructionText>
   )}

   {character.components.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {character.components.map((component) => (
      <StudyInstructionText
       as="span"
       key={`${character.hanzi}-${component.text}-${component.meaning_vi}`}
       weight="semibold"
       className="rounded-lg border border-border-default px-2 py-1"
      >
       {[component.text, component.hanviet, component.meaning_vi, component.position_vi]
        .filter(Boolean)
        .join(" · ")}
      </StudyInstructionText>
     ))}
    </div>
   )}
  </div>
 );
}
