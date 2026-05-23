"use client";

import { useMemo, useState } from "react";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
import { GrammarPointList } from "@/features/hanzihome/components/GrammarPointList";
import { GrammarPointReader } from "@/features/hanzihome/components/GrammarPointReader";
import { GrammarPracticeMini } from "@/features/hanzihome/components/GrammarPracticeMini";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 LearningStatus,
 UserLearningState,
} from "@/features/hanzihome/types";

type GrammarWorkspaceProps = {
 lesson: HanziHomeLesson;
 state: UserLearningState;
 onBookmark: (id: string) => void;
 onMarkStatus: (id: string, status: LearningStatus) => void;
};

const ALL_GRAMMAR_POINTS_ID = "__all__";

export function GrammarWorkspace({
 lesson,
 state,
 onBookmark,
 onMarkStatus,
}: GrammarWorkspaceProps) {
 const [selectedPointId, setSelectedPointId] = useState<string | null>(
  lesson.grammar[0]?.id || null,
 );

 const isAllView = selectedPointId === ALL_GRAMMAR_POINTS_ID;

 const selectedPoint = useMemo(
  () =>
   isAllView
    ? null
    : lesson.grammar.find((point) => point.id === selectedPointId) ||
      lesson.grammar[0] ||
      null,
  [isAllView, lesson.grammar, selectedPointId],
 );

 const progress = state.progress.grammar || {};
 const bookmarks = state.bookmarks.grammar || [];

 const relatedVocab = useMemo(() => {
  if (!selectedPoint) return [];

  const text = [
   selectedPoint.cleanTitle,
   selectedPoint.core,
   selectedPoint.structuresView.join(" "),
   selectedPoint.examplesParsed.map((example) => example.zh).join(" "),
  ].join(" ");

  return lesson.vocab.filter((word) => text.includes(word.word)).slice(0, 8);
 }, [lesson.vocab, selectedPoint]);

 return (
  <div className="grid gap-5 lg:grid-cols-[minmax(20rem,23.75rem)_minmax(0,1fr)]">
   <div className="grid content-start gap-5">
    <GrammarPointList
     points={lesson.grammar}
     selectedPointId={
      isAllView ? ALL_GRAMMAR_POINTS_ID : selectedPoint?.id || null
     }
     progress={progress}
     onSelectPoint={setSelectedPointId}
     allPointId={ALL_GRAMMAR_POINTS_ID}
    />

    {!isAllView && <GrammarPracticeMini point={selectedPoint} />}
   </div>

   {isAllView ? (
    <AllGrammarPointReader points={lesson.grammar} draftId={lesson.draftId} />
   ) : (
    <GrammarPointReader
     point={selectedPoint}
     status={
      selectedPoint ? progress[selectedPoint.id]?.status || "new" : "new"
     }
     bookmarked={selectedPoint ? bookmarks.includes(selectedPoint.id) : false}
     relatedVocab={relatedVocab}
     editDraftId={lesson.draftId}
     editItemId={selectedPoint?.id}
     onBookmark={() => selectedPoint && onBookmark(selectedPoint.id)}
     onMarkStatus={(status) =>
      selectedPoint && onMarkStatus(selectedPoint.id, status)
     }
    />
   )}
  </div>
 );
}

function AllGrammarPointReader({
 points,
 draftId,
}: {
 points: GrammarViewModel[];
 draftId?: string;
}) {
 return (
  <div className="grid gap-4">
   {points.map((point, index) => (
    <article
     key={point.id}
     className="rounded-2xl border border-border-default bg-bg-primary p-5 shadow-theme-sm"
    >
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Điểm ngữ pháp {index + 1}
       </p>

       <h2 className="mt-2 text-xl font-black text-text-primary">
        {point.cleanTitle}
       </h2>
      </div>

      {draftId && (
       <InlineDraftItemEditDialog
        kind="grammar"
        draftId={draftId}
        itemId={point.id}
       />
      )}
     </div>

     {point.core && (
      <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">
       {point.core}
      </p>
     )}

     {point.structuresView.length > 0 && (
      <section className="mt-4 grid gap-2">
       <h3 className="text-sm font-black text-text-primary">Công thức</h3>
       {point.structuresView.map((structure) => (
        <p
         key={structure}
         className="rounded-2xl border border-info/30 bg-info-subtle p-3 text-sm font-black text-info-text"
        >
         {structure}
        </p>
       ))}
      </section>
     )}

     {point.examplesParsed.length > 0 && (
      <section className="mt-4 grid gap-2">
       <h3 className="text-sm font-black text-text-primary">Ví dụ</h3>
       {point.examplesParsed.slice(0, 5).map((example) => (
        <div
         key={`${point.id}-${example.zh}-${example.vi}`}
         className="rounded-2xlbg-bg-subtle p-3"
        >
         <p className="font-black leading-relaxed text-text-primary">
          {example.zh}
         </p>
         {example.vi && (
          <p className="text-sm font-semibold leading-relaxed text-text-secondary">
           {example.vi}
          </p>
         )}
        </div>
       ))}
      </section>
     )}

     {point.notes.length > 0 && (
      <section className="mt-4 grid gap-2">
       <h3 className="text-sm font-black text-text-primary">Lưu ý</h3>
       {point.notes.slice(0, 5).map((note) => (
        <p key={note} className="text-sm leading-relaxed text-text-secondary">
         {note}
        </p>
       ))}
      </section>
     )}
    </article>
   ))}
  </div>
 );
}
