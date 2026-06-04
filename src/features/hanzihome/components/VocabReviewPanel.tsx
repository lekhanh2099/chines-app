"use client";

import { useCallback, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  Sigma,
} from "lucide-react";

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
import { GrammarPointReader } from "@/features/hanzihome/components/GrammarPointReader";
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
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type VocabReviewPanelProps = {
  lesson: HanziHomeLesson;
  learningState: UserLearningState;
  initialMode?: ReviewDeckMode;
  availableModes?: ReviewDeckMode[];
  title?: string;
  description?: string;
  onAnswer: (
    item: { type: "vocab" | "grammar" | "radical"; id: string },
    result: ReviewResult,
  ) => void;
  onToggleBookmark?: (scope: "vocab" | "grammar", id: string) => void;
  getItemLesson?: (item: ReviewItem) => HanziHomeLesson | null;
};

const deckModeOptions: Array<{ value: ReviewDeckMode; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "vocab", label: "Từ vựng" },
  { value: "grammar", label: "Ngữ pháp" },
  { value: "hard", label: "Chỉ từ khó" },
];

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
    availableModes?.includes(initialMode) || !availableModes
      ? initialMode
      : fallbackMode,
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
      ? Array.from(item.source.hanzi).filter((char) =>
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
      <Card
        padding="lg"
        className="w-full max-w-3xl justify-self-center rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
      >
        <div className="grid gap-3 text-center">
          <ReviewHeader
            mode={mode}
            modes={modes}
            title={title}
            description={description}
            onModeChange={resetWithMode}
          />

          <div className="grid gap-2 rounded-xl border border-dashed border-border-default bg-bg-subtle p-4">
            <h2 className="text-2xl font-black text-text-primary">
              Chưa có thẻ để ôn
            </h2>
            <p className="text-sm font-semibold text-text-muted">
              Deck này chưa có dữ liệu phù hợp. Thử đổi sang “Tất cả” hoặc thêm
              từ vựng/ngữ pháp cho bài.
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
          <ReviewHeader
            mode={mode}
            modes={modes}
            title={title}
            description={description}
            onModeChange={resetWithMode}
          />

          <div className="grid gap-2 rounded-xl bg-bg-subtle p-4">
            <h2 className="text-2xl font-black text-text-primary">
              Đã hết lượt ôn
            </h2>
            <p className="text-sm font-semibold text-text-muted">
              Bạn đã đi qua toàn bộ thẻ ôn trong deck này.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={session.previous}>
              Trở lại thẻ cuối
            </Button>
            <Button onClick={session.reset}>
              <RotateCcw className="h-4 w-4" />
              Ôn lại
            </Button>
          </div>
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
        <ReviewHeader
          mode={mode}
          modes={modes}
          title={title}
          description={description}
          onModeChange={resetWithMode}
        />

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
          onAnswer={onAnswer}
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

        <p className="text-center text-xs font-bold text-text-muted">
          Space mở đáp án · P/N hoặc ←/→ trước/tiếp · D xem chi tiết
        </p>
      </div>
    </Card>
  );
}

function ReviewHeader({
  mode,
  modes = deckModeOptions,
  title = "Ôn tập chủ động",
  description,
  onModeChange,
}: {
  mode: ReviewDeckMode;
  modes?: Array<{ value: ReviewDeckMode; label: string }>;
  title?: string;
  description?: string;
  onModeChange: (mode: ReviewDeckMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
          Ôn tập
        </p>
        <h2 className="text-2xl font-black text-text-primary">{title}</h2>
        {description && (
          <p className="text-sm font-semibold text-text-muted">{description}</p>
        )}
      </div>

      {modes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {modes.map((item) => (
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
      )}
    </div>
  );
}

function StudyReviewCard({
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
  const isGrammar = item.type === "grammar";

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
        {isGrammar ? (
          <GrammarReviewFront item={item} />
        ) : (
          <VocabReviewFront item={item} />
        )}

        {revealed ? (
          <StudyReviewBack
            item={item}
            onOpenDetail={onOpenDetail}
            selectedWritingIndex={selectedWritingIndex}
            onSelectedWritingIndexChange={onSelectedWritingIndexChange}
          />
        ) : (
          <p className="rounded-xl bg-bg-subtle p-4 text-sm font-bold text-text-muted">
            {isGrammar
              ? "Tự nhớ ý nghĩa, công thức và ví dụ trước khi mở đáp án."
              : "Bấm vào thẻ hoặc nhấn Space để lật đáp án."}
          </p>
        )}
      </div>
    </div>
  );
}

function VocabReviewFront({
  item,
}: {
  item: Extract<ReviewItem, { type: "vocab" }>;
}) {
  return (
    <div className="grid gap-3">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle text-accent-text">
        <BookOpen className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
        Nhớ nghĩa và cách dùng
      </p>
      <h3
        className="text-6xl font-black tracking-normal text-text-primary"
        lang="zh-CN"
      >
        {item.prompt}
      </h3>
    </div>
  );
}

function GrammarReviewFront({
  item,
}: {
  item: Extract<ReviewItem, { type: "grammar" }>;
}) {
  return (
    <div className="grid gap-4 text-left">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-info-subtle text-info-text">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">
          Nhận diện ngữ pháp
        </p>
        <h3 className="mt-2 text-3xl font-black tracking-tight text-text-primary">
          {item.prompt}
        </h3>
      </div>
      <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-4">
        <p className="text-sm font-black text-text-primary">
          Trước khi mở đáp án, tự trả lời:
        </p>
        <ul className="grid gap-1 text-sm font-semibold leading-relaxed text-text-secondary">
          <li>Ý nghĩa cốt lõi là gì?</li>
          <li>Công thức / pattern chính là gì?</li>
          <li>Dùng trong câu ví dụ nào?</li>
        </ul>
      </div>
    </div>
  );
}

function StudyReviewBack({
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
    const example = item.source.examples[0];

    return (
      <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <p className="font-pinyin text-xl font-black text-text-primary">
              {item.source.pinyin}
            </p>

            <p className="text-base font-bold text-text-secondary">
              {item.source.meaning.hanviet} ·{" "}
              {getVocabDisplayMeaning(item.source)}
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
            <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
              D
            </kbd>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="rounded-xl border border-primary/20 bg-primary/8 p-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-wide text-primary">
                Ý nghĩa
              </p>
            </div>
            <p className="mt-2 text-base font-bold leading-relaxed text-text-primary">
              {item.source.core || item.answer}
            </p>
          </div>
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
          <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
            D
          </kbd>
        </Button>
      </div>

      {item.source.structuresView[0] && (
        <div className="rounded-xl border border-info/30 bg-info-subtle p-3">
          <div className="flex items-center gap-2">
            <Sigma className="h-4 w-4 text-info-text" />
            <p className="text-xs font-black uppercase tracking-wide text-info-text">
              Công thức
            </p>
          </div>
          <p className="mt-2 font-mono text-base font-black text-info-text">
            {item.source.structuresView[0]}
          </p>
        </div>
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
  lesson,
  onAnswer,
  onToggleBookmark,
  itemLesson,
}: {
  item: ReviewItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningState: UserLearningState;
  lesson: HanziHomeLesson;
  onAnswer: (
    item: { type: "vocab" | "grammar" | "radical"; id: string },
    result: ReviewResult,
  ) => void;
  onToggleBookmark?: (scope: "vocab" | "grammar", id: string) => void;
  itemLesson: HanziHomeLesson;
}) {
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
          <DialogTitle>
            {item.type === "vocab" ? "Chi tiết từ vựng" : "Chi tiết ngữ pháp"}
          </DialogTitle>
          <DialogDescription>
            Xem lại nội dung đang ôn trong bài hiện tại.
          </DialogDescription>
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
                if (nextStatus === "hard")
                  onAnswer({ type: "vocab", id: item.id }, "hard");
                if (nextStatus === "known")
                  onAnswer({ type: "vocab", id: item.id }, "known");
                if (nextStatus === "new")
                  onAnswer({ type: "vocab", id: item.id }, "again");
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
                if (nextStatus === "hard")
                  onAnswer({ type: "grammar", id: item.id }, "hard");
                if (nextStatus === "known")
                  onAnswer({ type: "grammar", id: item.id }, "known");
                if (nextStatus === "new")
                  onAnswer({ type: "grammar", id: item.id }, "again");
              }}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
