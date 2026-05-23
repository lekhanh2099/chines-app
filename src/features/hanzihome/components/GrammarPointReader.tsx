"use client";

import { Bookmark, CheckCircle2, Circle, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
 GrammarViewModel,
 LearningStatus,
 VocabViewModel,
} from "@/features/hanzihome/types";

type GrammarPointReaderProps = {
 point: GrammarViewModel | null;
 status: LearningStatus;
 bookmarked: boolean;
 relatedVocab: VocabViewModel[];
 onBookmark: () => void;
 onMarkStatus: (status: LearningStatus) => void;
};

export function GrammarPointReader({
 point,
 status,
 bookmarked,
 relatedVocab,
 onBookmark,
 onMarkStatus,
}: GrammarPointReaderProps) {
 if (!point) {
  return (
   <Card padding="lg" className="rounded-2xl">
    <p className="text-sm font-semibold text-text-muted">Bài này chưa có điểm ngữ pháp.</p>
   </Card>
  );
 }

 return (
  <Card padding="lg" className="rounded-2xl">
   <article className="flex flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <Badge variant="info">{status}</Badge>
      <h2 className="mt-3 text-2xl font-black tracking-normal text-text-primary">
       {point.cleanTitle}
      </h2>
      {point.core && (
       <p className="mt-2 text-sm leading-relaxed text-text-secondary">{point.core}</p>
      )}
     </div>
     <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
      <Bookmark className="h-4 w-4" />
      {bookmarked ? "Đã lưu" : "Lưu"}
     </Button>
    </div>

    <div className="flex flex-wrap gap-2">
     <Button variant={status === "known" ? "default" : "outline"} onClick={() => onMarkStatus("known")}>
      <CheckCircle2 className="h-4 w-4" />
      Đã biết
     </Button>
     <Button variant={status === "hard" ? "default" : "outline"} onClick={() => onMarkStatus("hard")}>
      <TriangleAlert className="h-4 w-4" />
      Còn khó
     </Button>
     <Button variant={status === "new" ? "default" : "outline"} onClick={() => onMarkStatus("new")}>
      <Circle className="h-4 w-4" />
      Học mới
     </Button>
    </div>

    {point.structuresView.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Công thức</h3>
      {point.structuresView.map((structure) => (
       <p key={structure} className="rounded-2xl border border-info/30 bg-info-subtle p-4 text-base font-black text-info-text">
        {structure}
       </p>
      ))}
     </section>
    )}

    {point.examplesParsed.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Ví dụ nhanh</h3>
      {point.examplesParsed.map((example) => (
       <div
        key={`${example.zh}-${example.vi}`}
        className="rounded-2xl bg-bg-subtle p-3"
       >
        <p className="font-black leading-relaxed text-text-primary">{example.zh}</p>
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
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Lưu ý / bẫy sai</h3>
      {point.notes.map((note) => (
       <p key={note} className="text-sm leading-relaxed text-text-secondary">{note}</p>
     ))}
    </section>
   )}

    {relatedVocab.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Từ vựng liên quan trong bài</h3>
      <div className="flex flex-wrap gap-2">
       {relatedVocab.map((word) => (
        <Badge key={word.id} variant="accent" size="lg">
         {word.word} · {word.meaning}
        </Badge>
       ))}
      </div>
     </section>
    )}
   </article>
  </Card>
 );
}
