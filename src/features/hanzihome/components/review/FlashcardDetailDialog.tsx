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
import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 hasCultureContent,
 hasWarningContent,
} from "@/features/hanzihome/components/vocab-detail/content-checks";
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
       <div className="min-w-0 grid gap-1">
        <HanziText
         as="h2"
         size="review"
         weight="black"
         leading="tight"
         tracking="normal"
         wrapping="breakWords"
        >
         {word.hanzi}
        </HanziText>
        <PinyinText as="p" variant="sectionTitle" tone="accent">
         {word.pinyin}
         {word.meaning.hanviet ? ` · ${word.meaning.hanviet}` : ""}
        </PinyinText>
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
        <StudyInstructionText variant="sectionTitle" weight="black">
         {word.meaning.short_definition_vi}
        </StudyInstructionText>
       )}
       {displayMeaning && <StudyInstructionText>{displayMeaning}</StudyInstructionText>}
       {naturalTranslations.length > 0 && (
        <StudyInstructionText>Tự nhiên: {naturalTranslations.join(", ")}</StudyInstructionText>
       )}
       {word.meaning.register_vi && (
        <StudyInstructionText>Sắc thái: {word.meaning.register_vi}</StudyInstructionText>
       )}
       {word.meaning.usage_domain_vi && (
        <StudyInstructionText>Phạm vi dùng: {word.meaning.usage_domain_vi}</StudyInstructionText>
       )}
       {word.meaning.notes.map((note) => (
        <StudyInstructionText key={note.text_vi}>{note.text_vi}</StudyInstructionText>
       ))}
      </div>
     </div>
    </section>

    {word.examples[0]?.zh && (
     <section className="rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm grid gap-2">
      <StudyInstructionText
       variant="overline"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Ví dụ nhanh
      </StudyInstructionText>
      <StudyInstructionText
       variant="sectionTitle"
       tone="default"
       weight="black"
       leading="relaxed"
       lang="zh-CN"
      >
       {word.examples[0].zh}
      </StudyInstructionText>
      {word.examples[0].pinyin && (
       <StudyInstructionText tone="accent" weight="bold">
        {word.examples[0].pinyin}
       </StudyInstructionText>
      )}
      {word.examples[0].vi && (
       <StudyInstructionText tone="muted" weight="semibold">
        {word.examples[0].vi}
       </StudyInstructionText>
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
     <section className="rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm grid gap-3">
      <StudyInstructionText
       variant="overline"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Cấu tạo chữ
      </StudyInstructionText>
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
