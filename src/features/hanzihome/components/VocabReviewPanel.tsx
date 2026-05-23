"use client";

import { useCallback, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVocabReviewSession } from "@/features/hanzihome/hooks/useVocabReviewSession";
import type {
 HanziHomeLesson,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type VocabReviewPanelProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onAnswer: (item: { type: "vocab" | "grammar" | "radical"; id: string }, result: ReviewResult) => void;
};

export function VocabReviewPanel({
 lesson,
 learningState,
 onAnswer,
}: VocabReviewPanelProps) {
 const session = useVocabReviewSession({
  vocab: lesson.vocab,
  grammar: lesson.grammar,
  vocabProgress: learningState.progress.vocab || {},
  grammarProgress: learningState.progress.grammar || {},
 });
 const item = session.currentItem;
 const { answer, next, reveal } = session;

 const handleAnswer = useCallback(
  (result: ReviewResult) => {
   if (!item) return;
   onAnswer({ type: item.type, id: item.id }, result);
   answer(result);
  },
  [answer, item, onAnswer],
 );

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
   }
   if (event.code === "Space") {
    event.preventDefault();
    reveal();
   }
   if (event.key === "1") handleAnswer("again");
   if (event.key === "2") handleAnswer("hard");
   if (event.key === "3") handleAnswer("known");
   if (event.key === "ArrowRight") next();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [handleAnswer, next, reveal]);

 if (!item || session.state.completed) {
  return (
   <Card padding="lg" className="mx-auto max-w-2xl rounded-2xl text-center">
    <div className="grid gap-4">
     <h2 className="text-2xl font-black text-text-primary">Đã hết lượt ôn</h2>
     <p className="text-sm font-semibold text-text-muted">
      Bạn đã đi qua toàn bộ từ vựng và ngữ pháp của bài này trong phiên hiện tại.
     </p>
     <Button onClick={session.reset} className="mx-auto">
      <RotateCcw className="h-4 w-4" />
      Ôn lại
     </Button>
    </div>
   </Card>
  );
 }

 const progress = Math.round(((session.state.index + 1) / session.items.length) * 100);

 return (
  <Card padding="lg" className="mx-auto w-full max-w-3xl rounded-2xl">
   <div className="grid gap-6">
    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <Badge variant={item.type === "vocab" ? "accent" : "info"}>
       {item.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
      </Badge>
      <span className="text-sm font-black uppercase tracking-wide text-text-muted">
       {session.state.index + 1} / {session.items.length}
      </span>
     </div>
     <div className="h-3 overflow-hidden rounded-full bg-bg-subtle">
      <div className="h-full rounded-full bg-accent" style={{ inlineSize: `${progress}%` }} />
     </div>
    </div>
    <h2 className="text-center text-5xl font-black tracking-normal text-text-primary">
     {item.prompt}
    </h2>
    <ReviewBack item={item} revealed={session.state.revealed} onReveal={session.reveal} />
    <div className="flex flex-wrap justify-center gap-2">
     <Button variant="outline" onClick={() => handleAnswer("again")}>Học lại</Button>
     <Button variant="outline" onClick={() => handleAnswer("hard")}>Còn khó</Button>
     <Button onClick={() => handleAnswer("known")}>Đã biết</Button>
    </div>
    <p className="text-center text-xs font-bold text-text-muted">
     Space lật thẻ · 1 học lại · 2 còn khó · 3 đã biết · → thẻ tiếp
    </p>
   </div>
  </Card>
 );
}

function ReviewBack({
 item,
 revealed,
 onReveal,
}: {
 item: NonNullable<ReturnType<typeof useVocabReviewSession>["currentItem"]>;
 revealed: boolean;
 onReveal: () => void;
}) {
 if (!revealed) {
  return <Button onClick={onReveal} className="mx-auto">Lật đáp án</Button>;
 }

 if (item.type === "vocab") {
  return (
   <div className="grid gap-2 rounded-2xl bg-bg-subtle p-5 text-center">
    <p className="text-lg font-black text-accent">{item.source.pinyin}</p>
    <p className="text-base font-bold text-text-secondary">
     {item.source.hanViet} · {item.source.meaning}
    </p>
   </div>
  );
 }

 if (item.type === "grammar") {
  return (
   <div className="grid gap-3 rounded-2xl bg-bg-subtle p-5">
    <p className="text-base font-semibold leading-relaxed text-text-secondary">
     {item.source.core}
    </p>
    {item.source.structuresView[0] && (
     <p className="rounded-2xl border border-info/30 bg-info-subtle p-3 text-base font-black text-info-text">
      {item.source.structuresView[0]}
     </p>
    )}
   </div>
  );
 }

 return null;
}
