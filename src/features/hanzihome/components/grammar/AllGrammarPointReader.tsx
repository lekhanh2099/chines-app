import { StructuredGrammarContent } from "@/features/hanzihome/components/grammar/StructuredGrammarContent";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function AllGrammarPointReader({
 points,
 editMode,
}: {
 points: GrammarViewModel[];
 editMode?: boolean;
}) {
 return (
  <div className="grid gap-4">
   {points.map((point, index) => (
    <article
     key={point.id}
     className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
    >
     <div className="grid gap-3">
      <div className="grid gap-1">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Điểm ngữ pháp {index + 1}
       </p>
       <h2 className="text-xl font-black text-text-primary">{point.cleanTitle}</h2>
      </div>

      <StructuredGrammarContent point={point} exampleLimit={5} editMode={editMode} />
     </div>
    </article>
   ))}
  </div>
 );
}
