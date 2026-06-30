"use client";

import { StructuredGrammarContent } from "@/features/hanzihome/components/grammar/StructuredGrammarContent";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function AllGrammarPointReader({
 lessonId,
 points,
 editMode,
}: {
 lessonId?: string;
 points: GrammarViewModel[];
 editMode?: boolean;
}) {
 return (
  <div className="grid gap-4">
   {points.map((point, index) => {
    const pointPath: EditableNodePath = ["grammar", index];
    const content = (
     <article className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm">
      <div className="grid gap-3">
       <div className="grid gap-1">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Điểm ngữ pháp {index + 1}
        </p>
        <h2 className="text-xl font-black text-text-primary">{point.cleanTitle}</h2>
       </div>

       <StructuredGrammarContent
        point={point}
        lessonId={lessonId}
        pointPath={pointPath}
        exampleLimit={5}
        editMode={editMode}
       />
      </div>
     </article>
    );

    return editMode && lessonId ? (
     <EditableNodeWrapper
      key={point.id}
      lessonId={lessonId}
      entityType="grammar_point"
      entityId={point.id}
      path={pointPath}
      value={point}
      label={point.cleanTitle}
      editLabel="Sửa ngữ pháp"
     >
      {content}
     </EditableNodeWrapper>
    ) : (
     <div key={point.id}>{content}</div>
    );
   })}
  </div>
 );
}
