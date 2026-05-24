"use client";

import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VocabWritingCue } from "@/features/hanzihome/components/VocabWritingCue";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { useFlashcardControls } from "@/features/hanzihome/hooks/useFlashcardControls";
import { VocabDetailPanel } from "@/features/hanzihome/components/VocabDetailPanel";
import {
 useVocabReviewSession,
 type ReviewDeckMode,
 type ReviewItem,
} from "@/features/hanzihome/hooks/useVocabReviewSession";
import type {
 HanziHomeLesson,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type VocabReviewPanelProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 onAnswer: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
};

const deckModes: Array<{ value: ReviewDeckMode; label: string }> = [
 { value: "all", label: "Tất cả" },
 { value: "vocab", label: "Từ vựng" },
 { value: "grammar", label: "Ngữ pháp" },
 { value: "hard", label: "Chỉ từ khó" },
];

export function VocabReviewPanel({
 lesson,
 learningState,
 onAnswer,
}: VocabReviewPanelProps) {
 const [mode, setMode] = useState<ReviewDeckMode>("all");
 const [detailOpen, setDetailOpen] = useState(false);
 const [selectedWritingIndex, setSelectedWritingIndex] = useState(0);

 const session = useVocabReviewSession({
  vocab: lesson.vocab,
  grammar: lesson.grammar,
  vocabProgress: learningState.progress.vocab || {},
  grammarProgress: learningState.progress.grammar || {},
  mode,
 });

 const item = session.currentItem;
 const { answer, reveal } = session;

 const writingCharacterCount =
  item?.type === "vocab" && session.state.revealed
   ? Array.from(item.source.word).filter((char) =>
    /\p{Script=Han}/u.test(char),
   ).length
   : 0;

 const handleAnswer = useCallback(
  (result: ReviewResult) => {
   if (!item) return;

   onAnswer({ type: item.type, id: item.id }, result);
   answer(result);
  },
  [answer, item, onAnswer],
 );

 const flashcardControls = useFlashcardControls({
  disabled: !item || session.state.completed || detailOpen,
  canOpenDetail: Boolean(item && item.type === "vocab" && session.state.revealed),
  writingCharacterCount,
  onReveal: reveal,
  onAnswer: handleAnswer,
  onOpenDetail: () => setDetailOpen(true),
  onSelectWritingCharacter: setSelectedWritingIndex,
 });

 const resetWithMode = (nextMode: ReviewDeckMode) => {
  setMode(nextMode);
  session.reset();
 };

 if (session.items.length === 0) {
  return (
   <Card
    padding="lg"
    className="w-full max-w-3xl justify-self-center rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <div className="grid gap-3 text-center">
     <ReviewHeader mode={mode} onModeChange={resetWithMode} />

     <div className="grid gap-2 rounded-xl border border-dashed border-border-default bg-bg-subtle p-4">
      <h2 className="text-2xl font-black text-text-primary">
       Chưa có thẻ để ôn
      </h2>
      <p className="text-sm font-semibold text-text-muted">
       Deck này chưa có dữ liệu phù hợp. Thử đổi sang “Tất cả” hoặc thêm từ
       vựng/ngữ pháp cho bài.
      </p>
     </div>
    </div>
   </Card>
  );
 }

 if (!item || session.state.completed) {
  return (
   <Card
    padding="lg"
    className="w-full max-w-3xl justify-self-center rounded-xl border border-border-default bg-bg-primary text-center shadow-theme-sm"
   >
    <div className="grid gap-3">
     <ReviewHeader mode={mode} onModeChange={resetWithMode} />

     <div className="grid gap-2 rounded-xl bg-bg-subtle p-4">
      <h2 className="text-2xl font-black text-text-primary">Đã hết lượt ôn</h2>
      <p className="text-sm font-semibold text-text-muted">
       Bạn đã đi qua toàn bộ flashcard trong deck này.
      </p>
     </div>

     <Button onClick={session.reset} className="justify-self-center">
      <RotateCcw className="h-4 w-4" />
      Ôn lại
     </Button>
    </div>
   </Card>
  );
 }

 const progress = Math.round(
  ((session.state.index + 1) / session.items.length) * 100,
 );

 return (
  <Card
   padding="lg"
   className="w-full max-w-4xl justify-self-center rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <div className="grid gap-3">
    <ReviewHeader mode={mode} onModeChange={resetWithMode} />

    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant={item.type === "vocab" ? "accent" : "info"}>
        {item.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
       </Badge>
      </div>

      <span className="text-sm font-black uppercase tracking-wide text-text-muted">
       {session.state.index + 1} / {session.items.length}
      </span>
     </div>

     <div className="h-3 overflow-hidden rounded-full bg-bg-subtle">
      <div
       className="h-full rounded-full bg-accent"
       style={{ inlineSize: `${progress}%` }}
      />
     </div>
    </div>

    <FlashCard
     item={item}
     revealed={session.state.revealed}
     onReveal={session.reveal}
     onOpenDetail={() => setDetailOpen(true)}
     selectedWritingIndex={selectedWritingIndex}
     onSelectedWritingIndexChange={setSelectedWritingIndex}
     touchHandlers={flashcardControls}
    />

    <FlashcardDetailDialog
     item={item}
     open={detailOpen}
     onOpenChange={setDetailOpen}
     learningState={learningState}
     onAnswer={onAnswer}
    />

    <div className="flex flex-wrap justify-center gap-2">
     <Button variant="outline" onClick={() => handleAnswer("again")}>
      Học lại
     </Button>
     <Button variant="outline" onClick={() => handleAnswer("hard")}>
      Còn khó
     </Button>
     <Button onClick={() => handleAnswer("known")}>Đã biết</Button>
    </div>

    <p className="text-center text-xs font-bold text-text-muted">
     Space/Enter lật thẻ · D xem chi tiết · mặt sau vocab: 1/2/3 chọn chữ · ←/↓/→ chấm điểm · Mobile: vuốt trái/phải/lên
    </p>
   </div>
  </Card>
 );
}

function ReviewHeader({
 mode,
 onModeChange,
}: {
 mode: ReviewDeckMode;
 onModeChange: (mode: ReviewDeckMode) => void;
}) {
 return (
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div>
    <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
     Flashcards
    </p>
    <h2 className="text-2xl font-black text-text-primary">
     Ôn tập chủ động
    </h2>
   </div>

   <div className="flex flex-wrap gap-2">
    {deckModes.map((item) => (
     <Button
      key={item.value}
      type="button"
      variant={mode === item.value ? "default" : "outline"}
      onClick={() => onModeChange(item.value)}
     >
      {item.label}
     </Button>
    ))}
   </div>
  </div>
 );
}

function FlashCard({
 item,
 revealed,
 onReveal,
 onOpenDetail,
 selectedWritingIndex,
 onSelectedWritingIndexChange,
 touchHandlers,
}: {
 item: ReviewItem;
 revealed: boolean;
 onReveal: () => void;
 onOpenDetail: () => void;
 selectedWritingIndex: number;
 onSelectedWritingIndexChange: (index: number) => void;
 touchHandlers: ReturnType<typeof useFlashcardControls>;
}) {
 return (
  <div
   role="button"
   tabIndex={0}
   onClick={onReveal}
   onTouchStart={touchHandlers.onTouchStart}
   onTouchEnd={touchHandlers.onTouchEnd}
   className="grid min-h-80 w-full touch-pan-y select-none place-items-center rounded-xl border border-border-default bg-bg-primary p-3 text-center shadow-theme-sm transition-colors hover:border-accent-muted sm:p-4"
  >
   <div className="grid w-full max-w-3xl gap-3">
    <div className="grid gap-3">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
      Mặt trước
     </p>

     <h3
      className={
       item.type === "vocab"
        ? "font-hanzi-display text-6xl font-black tracking-normal text-text-primary"
        : "text-3xl font-black tracking-tight text-text-primary"
      }
      lang={item.type === "vocab" ? "zh-CN" : "vi"}
     >
      {item.prompt}
     </h3>
    </div>

    {revealed ? (
     <FlashCardBack
      item={item}
      onOpenDetail={onOpenDetail}
      selectedWritingIndex={selectedWritingIndex}
      onSelectedWritingIndexChange={onSelectedWritingIndexChange}
     />
    ) : (
     <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
      Bấm vào thẻ hoặc nhấn Space để lật đáp án.
     </p>
    )}
   </div>
  </div>
 );
}

function FlashCardBack({
 item,
 onOpenDetail,
 selectedWritingIndex,
 onSelectedWritingIndexChange,
}: {
 item: ReviewItem;
 onOpenDetail: () => void;
 selectedWritingIndex: number;
 onSelectedWritingIndexChange: (index: number) => void;
}) {
 if (item.type === "vocab") {
  const example = item.source.examplesParsed[0];

  return (
   <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <p className="font-pinyin text-xl font-black text-text-primary">
       {item.source.pinyin}
      </p>

      <p className="text-base font-bold text-text-secondary">
       {item.source.hanViet} · {item.source.meaning}
      </p>
     </div>

     <Button
      type="button"
      variant="outline"
      className="shrink-0 rounded-lg"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
       event.stopPropagation();
       onOpenDetail();
      }}
     >
      Xem chi tiết
     </Button>
    </div>

    <VocabWritingCue
     word={item.source}
     size={180}
     autoPlay
     selectedIndex={selectedWritingIndex}
     onSelectedIndexChange={onSelectedWritingIndexChange}
    />

    {example && (
     <div className="grid gap-1 rounded-xl border border-border-default bg-bg-primary p-3 shadow-theme-sm sm:p-4">
      <p
       className="font-hanzi text-base font-black text-text-primary"
       lang="zh-CN"
      >
       {example.zh}
      </p>

      {example.pinyin && (
       <p className="font-pinyin text-sm font-bold text-text-muted">
        {example.pinyin}
       </p>
      )}

      {example.vi && (
       <p className="text-sm font-semibold text-text-secondary">
        {example.vi}
       </p>
      )}
     </div>
    )}
   </div>
  );
 }

 const example = item.source.examplesParsed[0];

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
   <p className="text-base font-semibold leading-relaxed text-text-secondary">
    {item.source.core}
   </p>

   {item.source.structuresView[0] && (
    <p className="rounded-xl border border-info/30 bg-info-subtle p-3 text-base font-black text-info-text">
     {item.source.structuresView[0]}
    </p>
   )}

   {example && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3 shadow-theme-sm sm:p-4">
     <p
      className="font-hanzi text-base font-black text-text-primary"
      lang="zh-CN"
     >
      {example.zh}
     </p>

     {example.vi && (
      <p className="text-sm font-semibold text-text-secondary">
       {example.vi}
      </p>
     )}
    </div>
   )}
  </div>
 );
}

function FlashcardDetailDialog({
 item,
 open,
 onOpenChange,
 learningState,
 onAnswer,
}: {
 item: ReviewItem;
 open: boolean;
 onOpenChange: (open: boolean) => void;
 learningState: UserLearningState;
 onAnswer: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
}) {
 if (item.type !== "vocab") {
  return null;
 }

 const status = learningState.progress.vocab?.[item.id]?.status || "new";
 const bookmarked = Boolean(learningState.bookmarks.vocab?.includes(item.id));

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
    <DialogHeader className="shrink-0 border-b border-border-default px-6 py-5">
     <DialogTitle>Chi tiết từ vựng</DialogTitle>
     <DialogDescription>
      Xem lại nghĩa, logic, ví dụ và lưu ý của từ đang ôn.
     </DialogDescription>
    </DialogHeader>
    <DialogBody className="min-h-0 flex-1 overflow-y-auto scrollbar-soft py-2">
     <VocabDetailPanel
      word={item.source}
      status={status}
      bookmarked={bookmarked}
      onBookmark={() => {
       // TODO: hiện review panel chưa nhận toggleBookmark.
       // Sẽ wire sau nếu cần bookmark trực tiếp trong dialog.
      }}
      onMarkStatus={(nextStatus) => {
       if (nextStatus === "hard")
        onAnswer({ type: "vocab", id: item.id }, "hard");
       if (nextStatus === "known")
        onAnswer({ type: "vocab", id: item.id }, "known");
       if (nextStatus === "new")
        onAnswer({ type: "vocab", id: item.id }, "again");
      }}
     />
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
