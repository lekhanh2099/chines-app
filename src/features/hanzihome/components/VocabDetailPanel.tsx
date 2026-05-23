"use client";

import { Bookmark, CheckCircle2, Circle, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LearningStatus, VocabViewModel } from "@/features/hanzihome/types";

type VocabDetailPanelProps = {
 word: VocabViewModel | null;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 status,
 bookmarked,
 onBookmark,
 onMarkStatus,
}: VocabDetailPanelProps) {
 if (!word) {
  return (
   <Card padding="lg" className="rounded-2xl">
    <p className="text-sm font-semibold text-text-muted">Chọn một từ để xem chi tiết.</p>
   </Card>
  );
 }

 return (
  <Card padding="lg" className="rounded-2xl">
   <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <h2 className="text-5xl font-black tracking-normal text-text-primary">
        {word.word}
       </h2>
       <Badge variant="accent">{status}</Badge>
       {word.level && <Badge>{word.level}</Badge>}
      </div>
      <p className="mt-2 text-lg font-black text-accent">{word.pinyin}</p>
      <p className="text-sm font-bold text-text-secondary">
       {word.hanViet} · {word.meaning}
      </p>
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

    {word.detailSections.map((section) => (
     <section key={section.key} className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">{section.title}</h3>
      <div className="grid gap-2 text-sm leading-relaxed text-text-secondary">
       {section.lines.map((line) => (
        <p key={line}>{line}</p>
       ))}
      </div>
     </section>
    ))}

    {word.examplesParsed.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Ví dụ</h3>
      {word.examplesParsed.map((example) => (
       <div key={`${example.zh}-${example.vi}`} className="rounded-2xl bg-bg-subtle p-3">
        <p className="font-black text-text-primary">{example.zh}</p>
        {example.pinyin && <p className="text-sm font-semibold text-accent">{example.pinyin}</p>}
        {example.vi && <p className="text-sm text-text-secondary">{example.vi}</p>}
        {example.note && <p className="mt-1 text-xs font-semibold text-text-muted">{example.note}</p>}
       </div>
      ))}
     </section>
    )}
   </div>
  </Card>
 );
}
