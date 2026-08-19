import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { CharacterAnalysis } from "@/features/hanzihome/schemas/vocab.types";

export function CharacterAnalysisCard({ character }: { character: CharacterAnalysis }) {
 return (
  <Card variant="subtle" padding="md" className="grid max-w-2xs gap-2">
   <div className="flex flex-wrap items-center gap-2">
    <HanziText size="review" tone="default" weight="black" leading="none">
     {character.hanzi}
    </HanziText>
    {character.lishu_vi ? <Badge variant="accent">{character.lishu_vi}</Badge> : null}
    {character.main_radical ? (
     <Badge variant="danger">
      {[
       character.main_radical.radical_name_vi,
       character.main_radical.radical_variant || character.main_radical.radical,
      ]
       .filter(Boolean)
       .join(" · ")}
     </Badge>
    ) : null}
   </div>

   {character.modern_meaning_vi ? (
    <StudyInstructionText>{character.modern_meaning_vi}</StudyInstructionText>
   ) : null}
   {character.modern_logic_vi ? (
    <StudyInstructionText>{character.modern_logic_vi}</StudyInstructionText>
   ) : null}
   {character.structure_note_vi ? (
    <StudyInstructionText tone="muted">{character.structure_note_vi}</StudyInstructionText>
   ) : null}

   {character.components.length > 0 ? (
    <div className="grid gap-1">
     {character.components.map((component) => (
      <Typography
       as="span"
       key={`${character.hanzi}-${component.text}-${component.meaning_vi}`}
       variant="bodySmall"
       tone="secondary"
       weight="semibold"
      >
       {[component.text, component.hanviet, component.meaning_vi, component.position_vi]
        .filter(Boolean)
        .join(" · ")}
      </Typography>
     ))}
    </div>
   ) : null}
  </Card>
 );
}
