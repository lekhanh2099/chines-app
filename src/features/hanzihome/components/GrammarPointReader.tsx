"use client";

import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GrammarEditDialog } from "@/features/hanzihome/components/GrammarEditDialog";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
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
 lessonId?: string;
 canEditDbContent?: boolean;
 editDraftId?: string;
 editItemId?: string;
 onBookmark: () => void;
 onMarkStatus: (status: LearningStatus) => void;
};

export function GrammarPointReader({
 point,
 status,
 bookmarked,
 relatedVocab,
 lessonId,
 canEditDbContent = false,
 editDraftId,
 editItemId,
 onBookmark,
}: GrammarPointReaderProps) {
 if (!point) {
  return (
   <Card padding="lg" className="rounded-2xl -2xl">
    <p className="text-sm font-semibold text-text-muted">
     Bài này chưa có điểm ngữ pháp.
    </p>
   </Card>
  );
 }

 const contentMd = point.contentMd?.trim();

 return (
  <Card padding="lg" className="rounded-2xl -2xl">
   <article className="flex flex-col gap-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <Badge variant="info">{status}</Badge>
      <h2 className="mt-3 text-2xl font-black tracking-normal text-text-primary">
       {point.cleanTitle}
      </h2>
      {point.core && (
       <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {point.core}
       </p>
      )}
     </div>
     <div className="flex flex-wrap gap-2">
      {canEditDbContent && lessonId ? (
       <GrammarEditDialog lessonId={lessonId} point={point} />
      ) : null}

      {!canEditDbContent && !editDraftId && (
       <Button
        type="button"
        variant="outline"
        disabled
        title="Bài fallback tĩnh không thể sửa trực tiếp."
       >
        Sửa
       </Button>
      )}

      {editDraftId && editItemId && (
       <InlineDraftItemEditDialog
        kind="grammar"
        draftId={editDraftId}
        itemId={editItemId}
       />
      )}

      <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
       <Bookmark className="h-4 w-4" />
       {bookmarked ? "Đã lưu" : "Lưu"}
      </Button>
     </div>
    </div>

    {contentMd ? (
     <MarkdownContent content={contentMd} />
    ) : (
     <StructuredGrammarContent point={point} />
    )}

    {relatedVocab.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">
       Từ vựng liên quan trong bài
      </h3>
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

function StructuredGrammarContent({ point }: { point: GrammarViewModel }) {
 return (
  <>
   {point.structuresView.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Công thức</h3>
     {point.structuresView.map((structure) => (
      <p
       key={structure}
       className="rounded-2xl border border-info/30 bg-info-subtle p-4 text-base font-black text-info-text"
      >
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

   {point.detailSections && point.detailSections.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Chi tiết</h3>
     {point.detailSections.map((section) => (
      <div
       key={section.key}
       className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3"
      >
       <h4 className="text-sm font-black text-text-primary">
        {section.title}
       </h4>
       {section.lines.map((line) => (
        <p key={line} className="text-sm leading-relaxed text-text-secondary">
         {line}
        </p>
       ))}
      </div>
     ))}
    </section>
   )}

   {point.notes.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">
      Lưu ý / bẫy sai
     </h3>
     {point.notes.map((note) => (
      <p key={note} className="text-sm leading-relaxed text-text-secondary">
       {note}
      </p>
     ))}
    </section>
   )}
  </>
 );
}
