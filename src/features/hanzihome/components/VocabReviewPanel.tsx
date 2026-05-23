"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVocabReviewSession } from "@/features/hanzihome/hooks/useVocabReviewSession";
import type { HanziHomeLesson, ReviewResult } from "@/features/hanzihome/types";

type VocabReviewPanelProps = {
 lesson: HanziHomeLesson;
 onAnswer: (item: { type: "vocab" | "grammar" | "radical"; id: string }, result: ReviewResult) => void;
};

export function VocabReviewPanel({ lesson, onAnswer }: VocabReviewPanelProps) {
 const session = useVocabReviewSession({
  vocab: lesson.vocab,
  grammar: lesson.grammar,
  radicals: lesson.radicals,
 });
 const item = session.currentItem;

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

 const handleAnswer = (result: ReviewResult) => {
  onAnswer({ type: item.type, id: item.id }, result);
  session.answer(result);
 };

 return (
  <Card padding="lg" className="mx-auto max-w-3xl rounded-2xl">
   <div className="grid gap-6 text-center">
    <div className="text-sm font-black uppercase tracking-wide text-text-muted">
     {session.state.index + 1} / {session.items.length} · {item.type}
    </div>
    <h2 className="break-words text-5xl font-black tracking-normal text-text-primary">
     {item.prompt}
    </h2>
    {session.state.revealed ? (
     <p className="rounded-2xl bg-bg-subtle p-4 text-lg font-bold text-text-secondary">
      {item.answer}
     </p>
    ) : (
     <Button onClick={session.reveal} className="mx-auto">Lật đáp án</Button>
    )}
    <div className="flex flex-wrap justify-center gap-2">
     <Button variant="outline" onClick={() => handleAnswer("again")}>Học lại</Button>
     <Button variant="outline" onClick={() => handleAnswer("hard")}>Còn khó</Button>
     <Button onClick={() => handleAnswer("known")}>Đã biết</Button>
    </div>
   </div>
  </Card>
 );
}
