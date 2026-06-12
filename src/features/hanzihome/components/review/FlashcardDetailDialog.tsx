"use client";

import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { GrammarPointReader } from "@/features/hanzihome/components/grammar/GrammarPointReader";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import type { FlashcardDetailDialogProps } from "./types";

export function FlashcardDetailDialog({
 item,
 open,
 onOpenChange,
 learningState,
 lesson,
 onAnswer,
 onToggleBookmark,
 itemLesson,
}: FlashcardDetailDialogProps) {
 const status =
  item.type === "vocab"
   ? learningState.progress.vocab?.[item.id]?.status || "new"
   : learningState.progress.grammar?.[item.id]?.status || "new";
 const bookmarked =
  item.type === "vocab"
   ? Boolean(learningState.bookmarks.vocab?.includes(item.id))
   : Boolean(learningState.bookmarks.grammar?.includes(item.id));

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
    <DialogHeader className="shrink-0 border-b border-border-default px-6 py-5">
     <DialogTitle>{item.type === "vocab" ? "Chi tiết từ vựng" : "Chi tiết ngữ pháp"}</DialogTitle>
     <DialogDescription>Xem lại nội dung đang ôn trong bài hiện tại.</DialogDescription>
    </DialogHeader>
    <DialogBody className="min-h-0 flex-1 overflow-y-auto scrollbar-soft py-2">
     {item.type === "vocab" ? (
      <VocabDetailPanel
       word={item.source}
       status={status}
       bookmarked={bookmarked}
       lessonId={itemLesson.id}
       onBookmark={() => onToggleBookmark?.("vocab", item.id)}
       onMarkStatus={(nextStatus) => {
        if (nextStatus === "hard") onAnswer({ type: "vocab", id: item.id }, "hard");
        if (nextStatus === "known") onAnswer({ type: "vocab", id: item.id }, "known");
        if (nextStatus === "new") onAnswer({ type: "vocab", id: item.id }, "again");
       }}
      />
     ) : (
      <GrammarPointReader
       point={item.source}
       status={status}
       bookmarked={bookmarked}
       relatedVocab={lesson.vocab}
       lessonId={itemLesson.id}
       onBookmark={() => onToggleBookmark?.("grammar", item.id)}
       onMarkStatus={(nextStatus) => {
        if (nextStatus === "hard") onAnswer({ type: "grammar", id: item.id }, "hard");
        if (nextStatus === "known") onAnswer({ type: "grammar", id: item.id }, "known");
        if (nextStatus === "new") onAnswer({ type: "grammar", id: item.id }, "again");
       }}
      />
     )}
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
