"use client";

import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import { StructuredGrammarContent } from "@/features/hanzihome/components/grammar/StructuredGrammarContent";
import type {
 GrammarViewModel,
 HanziHomeVocabItem,
 LearningStatus,
} from "@/features/hanzihome/types";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import { getVocabDisplayMeaning, getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { z } from "zod";

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

type GrammarPointReaderProps = {
 point: Nullable<GrammarViewModel>;
 status: LearningStatus;
 bookmarked: boolean;
 relatedVocab: HanziHomeVocabItem[];
 lessonId?: string;
 pointPath?: Nullable<EditableNodePath>;
 editMode?: boolean;
 onBookmark: () => void;
 onMarkStatus: (status: LearningStatus) => void;
};

export function GrammarPointReader({
 point,
 status,
 bookmarked,
 relatedVocab,
 lessonId,
 pointPath,
 editMode,
 onBookmark,
}: GrammarPointReaderProps) {
 if (!point) {
  return (
   <Card padding="lg" className="rounded-xl">
    <p className="font-semibold text-text-muted">Bài này chưa có điểm ngữ pháp.</p>
   </Card>
  );
 }

 const contentMd = point.contentMd?.trim();
 const hasStructuredContent =
  point.structuresView.length > 0 ||
  point.examplesParsed.length > 0 ||
  Boolean(point.detailSections?.length) ||
  point.notes.length > 0;

 return (
  <Card padding="lg" className="rounded-xl border-border-default bg-bg-primary">
   <article className="flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <Badge variant="info" className="w-fit">
       {status}
      </Badge>
      <h2 className="text-2xl font-black tracking-normal text-text-primary">{point.cleanTitle}</h2>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
       <Bookmark className="h-4 w-4" />
       {bookmarked ? "Đã lưu" : "Lưu"}
      </Button>
     </div>
    </div>

    {hasStructuredContent ? (
     <StructuredGrammarContent
      point={point}
      lessonId={lessonId}
      pointPath={pointPath ?? undefined}
      editMode={editMode}
     />
    ) : contentMd ? (
     <MarkdownContent content={contentMd} />
    ) : null}

    {relatedVocab.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">Từ vựng liên quan trong bài</h3>
      <div className="flex flex-wrap gap-2">
       {relatedVocab.map((word) => (
        <Badge key={getVocabItemKey(word)} variant="accent" size="lg">
         {word.hanzi} · {getVocabDisplayMeaning(word)}
        </Badge>
       ))}
      </div>
     </section>
    )}
   </article>
  </Card>
 );
}
