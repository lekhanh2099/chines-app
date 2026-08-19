"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFlashcardControls } from "@/features/hanzihome/hooks/useFlashcardControls";
import {
 useVocabReviewSession,
 type ReviewDeckMode,
 type ReviewItem,
} from "@/features/hanzihome/hooks/useVocabReviewSession";
import type { HanziHomeLesson, ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import { FlashcardDetailDialog } from "./FlashcardDetailDialog";
import { ReviewHeader } from "./ReviewHeader";
import { StudyReviewCard } from "./StudyReviewCard";
import { deckModeOptions } from "./reviewDeckModes";
import type { ReviewAnswerHandler, ReviewBookmarkHandler } from "./types";

type VocabReviewPanelProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 initialMode?: ReviewDeckMode;
 availableModes?: ReviewDeckMode[];
 title?: string;
 description?: string;
 onAnswer: ReviewAnswerHandler;
 onToggleBookmark?: ReviewBookmarkHandler;
 getItemLesson?: (item: ReviewItem) => HanziHomeLesson | null;
};

export function VocabReviewPanel({
 lesson,
 learningState,
 initialMode = "all",
 availableModes,
 title = "Ôn tập chủ động",
 description,
 onAnswer,
 onToggleBookmark,
 getItemLesson,
}: VocabReviewPanelProps) {
 const modes = deckModeOptions.filter(
  (item) => !availableModes || availableModes.includes(item.value),
 );
 const fallbackMode = modes[0]?.value ?? "all";
 const [mode, setMode] = useState<ReviewDeckMode>(
  availableModes?.includes(initialMode) || !availableModes ? initialMode : fallbackMode,
 );
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
   ? Array.from(item.source.hanzi).filter((char) => /\p{Script=Han}/u.test(char)).length
   : 0;

 const handleAnswer = useCallback(
  (result: ReviewResult) => {
   if (!item) return;

   onAnswer({ type: item.type, id: item.id, label: item.prompt }, result);
   answer(result);
  },
  [answer, item, onAnswer],
 );

 const flashcardControls = useFlashcardControls({
  disabled: !item || session.state.completed || detailOpen,
  canOpenDetail: Boolean(item && session.state.revealed),
  writingCharacterCount,
  onReveal: reveal,
  onAnswer: handleAnswer,
  onPrevious: session.previous,
  onNext: session.next,
  onOpenDetail: () => setDetailOpen(true),
  onSelectWritingCharacter: setSelectedWritingIndex,
 });

 const resetWithMode = (nextMode: ReviewDeckMode) => {
  setMode(nextMode);
  session.reset();
 };

 if (session.items.length === 0) {
  return (
   <Card variant="elevated" padding="lg" className="w-full max-w-3xl justify-self-center">
    <div className="grid gap-5 text-center">
     <ReviewHeader
      mode={mode}
      modes={modes}
      title={title}
      description={description}
      onModeChange={resetWithMode}
     />

     <div className="grid gap-2 py-4">
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
       Chưa có thẻ để ôn
      </Typography>
      <StudyInstructionText tone="muted" weight="semibold">
       Deck này chưa có dữ liệu phù hợp. Thử đổi sang “Tất cả” hoặc thêm từ vựng/ngữ pháp cho bài.
      </StudyInstructionText>
     </div>
    </div>
   </Card>
  );
 }

 if (!item || session.state.completed) {
  return (
   <Card variant="elevated" padding="lg" className="w-full max-w-3xl justify-self-center">
    <div className="grid gap-5 text-center">
     <ReviewHeader
      mode={mode}
      modes={modes}
      title={title}
      description={description}
      onModeChange={resetWithMode}
     />

     <div className="grid gap-2 py-4">
      <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
       Đã hết lượt ôn
      </Typography>
      <StudyInstructionText tone="muted" weight="semibold">
       Bạn đã đi qua toàn bộ thẻ ôn trong deck này.
      </StudyInstructionText>
     </div>

     <div className="flex flex-wrap justify-center gap-2">
      <Button type="button" variant="outline" onClick={session.previous}>
       Trở lại thẻ cuối
      </Button>
      <Button onClick={session.reset}>
       <RotateCcw data-icon="inline-start" />
       Ôn lại
      </Button>
     </div>
    </div>
   </Card>
  );
 }

 const progress = Math.round(((session.state.index + 1) / session.items.length) * 100);

 return (
  <Card variant="elevated" padding="lg" className="w-full max-w-4xl justify-self-center">
   <div className="grid gap-3">
    <ReviewHeader
     mode={mode}
     modes={modes}
     title={title}
     description={description}
     onModeChange={resetWithMode}
    />

    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <Badge variant={item.type === "vocab" ? "accent" : "info"}>
       {item.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
      </Badge>

      <StudyInstructionText
       variant="overline"
       tone="muted"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       {session.state.index + 1} / {session.items.length}
      </StudyInstructionText>
     </div>

     <div className="h-2 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
      <div className="h-full rounded-full bg-accent" style={{ inlineSize: `${progress}%` }} />
     </div>
    </div>

    <StudyReviewCard
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
     lesson={lesson}
     onAnswer={(reviewItem, result) => onAnswer({ ...reviewItem, label: item.prompt }, result)}
     onToggleBookmark={onToggleBookmark}
     itemLesson={getItemLesson?.(item) ?? lesson}
    />

    <div className="flex flex-wrap items-center justify-center gap-2">
     <Button
      type="button"
      variant="outline"
      disabled={session.state.index === 0}
      onClick={session.previous}
     >
      Trước
     </Button>
     <Button variant="outline" onClick={() => handleAnswer("again")}>
      Học lại
     </Button>
     <Button variant="outline" onClick={() => handleAnswer("hard")}>
      Còn khó
     </Button>
     <Button onClick={() => handleAnswer("known")}>Đã biết</Button>
     <Button type="button" variant="outline" onClick={session.next}>
      Tiếp
     </Button>
    </div>

    <StudyInstructionText variant="caption" tone="muted" weight="bold" align="center">
     Space mở đáp án · P/N hoặc ←/→ trước/tiếp · D xem chi tiết
    </StudyInstructionText>
   </div>
  </Card>
 );
}
