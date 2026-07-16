import { Button } from "@/components/ui/button";
import type { CharacterAnalysis } from "@/features/hanzihome/schemas/vocab.types";

export function CharacterAnalysisCard({ character }: { character: CharacterAnalysis }) {
 return (
  <div className="grid max-w-2xs gap-2 rounded-xl border border-border-default bg-bg-primary p-3">
   <div className="flex flex-wrap items-center gap-2">
    <span className="text-3xl font-black text-text-primary" lang="zh-CN">
     {character.hanzi}
    </span>
    {character.lishu_vi && <span className="font-bold text-accent-text">{character.lishu_vi}</span>}
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

   {character.modern_meaning_vi && <p>{character.modern_meaning_vi}</p>}
   {character.modern_logic_vi && <p>{character.modern_logic_vi}</p>}
   {character.structure_note_vi && <p className="text-text-muted">{character.structure_note_vi}</p>}

   {character.components.length > 0 && (
    <div className="flex flex-wrap gap-2">
     {character.components.map((component) => (
      <span
       key={`${character.hanzi}-${component.text}-${component.meaning_vi}`}
       className="rounded-lg border border-border-default px-2 py-1 font-semibold"
      >
       {[component.text, component.hanviet, component.meaning_vi, component.position_vi]
        .filter(Boolean)
        .join(" · ")}
      </span>
     ))}
    </div>
   )}
  </div>
 );
}
