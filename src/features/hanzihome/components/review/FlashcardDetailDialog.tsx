"use client";

import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { GrammarPointReader } from "@/features/hanzihome/components/grammar/GrammarPointReader";
import { hasCultureContent, hasWarningContent } from "@/features/hanzihome/components/vocab-detail/content-checks";
import {
 CultureSection,
 StructuredVocabSections,
 WarningSection,
 WordFormationPreview,
} from "@/features/hanzihome/components/vocab-detail/VocabDetailSections";
import type { HanziHomeLesson, LearningStatus } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import type { FlashcardDetailDialogProps } from "./types";

type ReviewVocabItem = Extract<FlashcardDetailDialogProps["item"], { type: "vocab" }>;

function ReviewVocabDetailContent({
 item,
 status,
 bookmarked,
 itemLesson,
 onToggleBookmark,
}: {
 item: ReviewVocabItem;
 status: LearningStatus;
 bookmarked: boolean;
 itemLesson: HanziHomeLesson;
 onToggleBookmark?: FlashcardDetailDialogProps["onToggleBookmark"];
}) {
 const word = item.source;
 const displayMeaning = getVocabDisplayMeaning(word);
 const naturalTranslations = word.meaning.natural_translations_vi.filter(Boolean);

 return (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
   <div className="grid min-w-0 gap-4">
    <section className="rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm">
     <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="min-w-0">
        <h2
         className="break-words font-hanzi text-5xl font-black leading-tight tracking-normal text-text-primary"
         lang="zh-CN"
        >
         {word.hanzi}
        </h2>
        <p className="mt-1 text-lg font-black text-accent-text">
         {word.pinyin}
         {word.meaning.hanviet ? ` · ${word.meaning.hanviet}` : ""}
        </p>
       </div>

       <Button
        type="button"
        variant={bookmarked ? "default" : "outline"}
        onClick={() => onToggleBookmark?.("vocab", item.id)}
       >
        <Bookmark className="h-4 w-4" />
        {bookmarked ? "Đã lưu" : "Lưu"}
       </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
       {word.pos.raw_vi && <Badge variant="info">{word.pos.raw_vi}</Badge>}
       {word.level_tag !== "unknown" && <Badge variant="danger">{word.level_tag}</Badge>}
       <Badge variant={status === "known" ? "success" : status === "hard" ? "danger" : "default"}>
        {status === "known" ? "Đã nhớ" : status === "hard" ? "Khó" : "Đang học"}
       </Badge>
      </div>

      <div className="grid gap-2 text-base font-semibold leading-relaxed text-text-primary">
       {word.meaning.short_definition_vi && (
        <p className="text-lg font-black">{word.meaning.short_definition_vi}</p>
       )}
       {displayMeaning && <p>{displayMeaning}</p>}
       {naturalTranslations.length > 0 && <p>Tự nhiên: {naturalTranslations.join(", ")}</p>}
       {word.meaning.register_vi && <p>Sắc thái: {word.meaning.register_vi}</p>}
       {word.meaning.usage_domain_vi && <p>Phạm vi dùng: {word.meaning.usage_domain_vi}</p>}
       {word.meaning.notes.map((note) => (
        <p key={note.text_vi}>{note.text_vi}</p>
       ))}
      </div>
     </div>
    </section>

    {word.examples[0]?.zh && (
     <section className="rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm">
      <p className="text-xs font-black uppercase tracking-wide text-text-muted">Ví dụ nhanh</p>
      <p className="mt-2 text-xl font-black leading-relaxed text-text-primary" lang="zh-CN">
       {word.examples[0].zh}
      </p>
      {word.examples[0].pinyin && (
       <p className="mt-1 font-bold text-accent-text">{word.examples[0].pinyin}</p>
      )}
      {word.examples[0].vi && (
       <p className="mt-1 font-semibold text-text-muted">{word.examples[0].vi}</p>
      )}
     </section>
    )}

    <StructuredVocabSections
     item={word}
     lessonId={itemLesson.id}
     sectionView="all"
     keyword={word.hanzi}
    />
   </div>

   <aside className="grid min-w-0 content-start gap-4">
    {word.word_formation.characters.length > 0 && (
     <section className="rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm">
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-text-muted">
       Cấu tạo chữ
      </p>
      <WordFormationPreview formation={word.word_formation} />
     </section>
    )}

    {hasCultureContent(word.culture_note) && <CultureSection culture={word.culture_note} />}
    {hasWarningContent(word.warnings) && <WarningSection warnings={word.warnings} />}
   </aside>
  </div>
 );
}

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
   <DialogContent className="flex h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
    <DialogHeader className="shrink-0 border-b border-border-default px-6 py-5">
     <DialogTitle>{item.type === "vocab" ? "Chi tiết từ vựng" : "Chi tiết ngữ pháp"}</DialogTitle>
     <DialogDescription>Xem lại nội dung đang ôn trong bài hiện tại.</DialogDescription>
    </DialogHeader>
    <DialogBody className="min-h-0 flex-1 overflow-y-auto scrollbar-soft p-4">
     {item.type === "vocab" ? (
      <ReviewVocabDetailContent
       item={item}
       status={status}
       bookmarked={bookmarked}
       itemLesson={itemLesson}
       onToggleBookmark={onToggleBookmark}
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
