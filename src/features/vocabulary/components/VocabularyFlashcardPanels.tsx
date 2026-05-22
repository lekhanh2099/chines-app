"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
 Check,
 ChevronRight,
 Eye,
 Heart,
 HelpCircle,
 Layers3,
 Pause,
 PenLine,
 Play,
 RotateCcw,
 Search,
 Volume2,
 XCircle,
 type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import { LearningDrawer } from "@/features/learning/components";
import {
 ControlLabel,
 FilterChip,
 IconToolButton,
 MiniStat,
} from "@/features/vocabulary/components/VocabularyStudyPrimitives";
import { EmptyState } from "@/features/vocabulary/components/VocabularyManagementPanels";
import type { StudyWorkspaceProps } from "@/features/vocabulary/components/VocabularyLearningModule";
import type {
 AutoplayBehavior,
 FlashFrontMode,
 FlashOrder,
 FlashStatusFilter,
} from "@/features/vocabulary/types";
import {
 getCompactNote,
 getFlashLevel,
 getFlashStatus,
 getFrontText,
 getMeaning,
 getPrimaryExample,
 getStudyCharacters,
} from "@/features/vocabulary/utils/vocab-study";
import { cn } from "@/lib/utils";
import type {
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";

export function FlashcardFocusWorkspace(
 props: StudyWorkspaceProps & {
  rangeTitle: string;
  rangeCategories: string;
  rangeFresh: number;
 },
) {
 const [filterOpen, setFilterOpen] = useState(false);
 const [listOpen, setListOpen] = useState(false);
 const activeEntry = props.activeEntry;

 return (
  <section className="w-full max-w-full min-w-0 overflow-x-hidden bg-stone-50 px-3 pb-[calc(104px+env(safe-area-inset-bottom))] pt-3 sm:px-3 md:py-5">
   {activeEntry && (
    <div className="mx-auto mb-3 flex w-full max-w-5xl min-w-0 flex-wrap items-center justify-center gap-2 overflow-x-hidden text-xs font-black text-stone-500">
     <button type="button" onClick={() => setFilterOpen(true)} className="min-w-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 hover:bg-stone-50">
      Bộ lọc
     </button>
     <button type="button" onClick={() => setListOpen(true)} className="min-w-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 hover:bg-stone-50">
      Danh sách từ
     </button>
     <button
      type="button"
      onClick={() => props.onAutoplayEnabledChange(!props.autoplayEnabled)}
      className={cn(
       "min-w-0 rounded-full border px-3 py-1.5",
       props.autoplayEnabled ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-white hover:bg-stone-50",
      )}
     >
      {props.autoplayEnabled ? `Dừng tự phát ${props.autoplayInterval}s` : "Tự phát"}
     </button>
    </div>
   )}
   <div className="w-full max-w-full min-w-0 overflow-x-hidden">
    {!activeEntry ? (
     <div className="mx-auto w-full max-w-3xl min-w-0 overflow-hidden rounded-[28px] border-2 border-stone-100 bg-white p-4 sm:p-8">
      <EmptyState
       title="Không có từ trong bộ lọc"
       description="Đổi khoảng bài, trạng thái hoặc search để tiếp tục học."
       compact
      />
     </div>
    ) : (
     <FlashcardFocusMode {...props} activeEntry={activeEntry} />
    )}
   </div>
   {filterOpen && (
    <LearningDrawer
     title="Bộ lọc flashcard"
     onClose={() => setFilterOpen(false)}
    >
     <FlashFilterPanel {...props} />
    </LearningDrawer>
   )}
   {listOpen && (
    <LearningDrawer
     title="Danh sách từ trong bộ lọc"
     onClose={() => setListOpen(false)}
    >
     <QuickWordChips
      entries={props.entries}
      activeEntryId={activeEntry?.id}
      onSelect={(index) => {
       props.onSelectCard(index);
       setListOpen(false);
      }}
      expanded
     />
    </LearningDrawer>
   )}
  </section>
 );
}

export function FlashFilterPanel(props: {
 lessons: VocabLessonWithStats[];
 fromLesson: number;
 toLesson: number;
 flashLevels: string[];
 flashStatusFilter: FlashStatusFilter;
 levelFilter: string;
 flashOrder: FlashOrder;
 frontMode: FlashFrontMode;
 showExamples: boolean;
 autoplayEnabled: boolean;
 autoplayInterval: number;
 autoplayBehavior: AutoplayBehavior;
 searchQuery: string;
 flashStats: {
  range: number;
  filtered: number;
  known: number;
  hard: number;
  again: number;
 };
 onFromLessonChange: (value: number) => void;
 onToLessonChange: (value: number) => void;
 onSearchChange: (value: string) => void;
 onFlashStatusFilterChange: (value: FlashStatusFilter) => void;
 onLevelFilterChange: (value: string) => void;
 onFlashOrderChange: (value: FlashOrder) => void;
 onFrontModeChange: (value: FlashFrontMode) => void;
 onShowExamplesChange: (value: boolean) => void;
 onAutoplayEnabledChange: (value: boolean) => void;
 onAutoplayIntervalChange: (value: number) => void;
 onAutoplayBehaviorChange: (value: AutoplayBehavior) => void;
 onResetFilteredProgress: () => void;
}) {
 const lessonNumbers = props.lessons
  .map((lesson) => lesson.lesson_number)
  .filter((lessonNumber): lessonNumber is number => lessonNumber !== null);
 const minLesson = lessonNumbers.length ? Math.min(...lessonNumbers) : 11;
 const maxLesson = lessonNumbers.length ? Math.max(...lessonNumbers) : 25;
 const statusItems: { key: FlashStatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Mới" },
  { key: "known", label: "Đã biết" },
  { key: "hard", label: "Còn khó" },
  { key: "again", label: "Học lại" },
 ];

 return (
  <aside className="w-full max-w-full min-w-0 overflow-x-hidden rounded-[24px] border-2 border-stone-200 bg-white p-4 text-left shadow-theme-sm">
   <div className="grid grid-cols-2 gap-2">
    <MiniStat label="Trong khoảng" value={props.flashStats.range} />
    <MiniStat label="Đang hiện" value={props.flashStats.filtered} />
    <MiniStat label="Đã biết" value={props.flashStats.known} tone="green" />
    <MiniStat label="Còn khó" value={props.flashStats.hard} tone="yellow" />
    <MiniStat label="Học lại" value={props.flashStats.again} tone="red" />
   </div>

   <div className="mt-4 grid grid-cols-2 gap-2">
    <label className="text-xs font-black uppercase tracking-wide text-stone-500">
     Từ bài
     <Input
      type="number"
      min={minLesson}
      max={maxLesson}
      value={props.fromLesson}
      onChange={(event) =>
       props.onFromLessonChange(Number(event.target.value) || minLesson)
      }
      className="mt-1 h-11 rounded-2xl border-2 font-black"
     />
    </label>
    <label className="text-xs font-black uppercase tracking-wide text-stone-500">
     Đến bài
     <Input
      type="number"
      min={minLesson}
      max={maxLesson}
      value={props.toLesson}
      onChange={(event) =>
       props.onToLessonChange(Number(event.target.value) || maxLesson)
      }
      className="mt-1 h-11 rounded-2xl border-2 font-black"
     />
    </label>
   </div>

   <div className="mt-3 flex flex-wrap gap-1.5">
    {props.lessons.map((lesson) => {
     const lessonNumber = lesson.lesson_number || 0;
     const selected =
      lessonNumber >= Math.min(props.fromLesson, props.toLesson) &&
      lessonNumber <= Math.max(props.fromLesson, props.toLesson);
     return (
      <button
       key={lesson.id}
       type="button"
       onClick={() => {
        props.onFromLessonChange(lessonNumber);
        props.onToLessonChange(lessonNumber);
       }}
       className={cn(
        "rounded-full border-2 px-2.5 py-1 text-xs font-black transition",
        selected
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
       )}
      >
       B{lessonNumber}
      </button>
     );
    })}
   </div>

   <label className="mt-4 block text-xs font-black uppercase tracking-wide text-stone-500">
    Tìm trong bộ lọc
    <Input
     value={props.searchQuery}
     onChange={(event) => props.onSearchChange(event.target.value)}
     placeholder="Hán tự, pinyin, nghĩa..."
     className="mt-1 h-11 rounded-2xl border-2 font-bold"
    />
   </label>

   <div className="mt-4">
    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
     Trạng thái
    </p>
    <div className="mt-2 flex flex-wrap gap-1.5">
     {statusItems.map((item) => (
      <FilterChip
       key={item.key}
       active={props.flashStatusFilter === item.key}
       onClick={() => props.onFlashStatusFilterChange(item.key)}
      >
       {item.label}
      </FilterChip>
     ))}
    </div>
   </div>

   <div className="mt-4 grid gap-2">
    <ControlLabel label="Level">
     <Select
      value={props.levelFilter}
      onChange={(event) => props.onLevelFilterChange(event.target.value)}
     >
      <option value="all">Tất cả level</option>
      {props.flashLevels.map((level) => (
       <option key={level} value={level}>
        {level}
       </option>
      ))}
     </Select>
    </ControlLabel>
    <ControlLabel label="Thứ tự">
     <Select
      value={props.flashOrder}
      onChange={(event) =>
       props.onFlashOrderChange(event.target.value as FlashOrder)
      }
     >
      <option value="lesson">Theo bài</option>
      <option value="random">Random</option>
      <option value="hardFirst">Ưu tiên khó</option>
     </Select>
    </ControlLabel>
    <ControlLabel label="Mặt trước">
     <Select
      value={props.frontMode}
      onChange={(event) =>
       props.onFrontModeChange(event.target.value as FlashFrontMode)
      }
     >
      <option value="hanzi">Hán tự</option>
      <option value="meaning">Nghĩa Việt</option>
      <option value="pinyin">Pinyin</option>
     </Select>
    </ControlLabel>
   </div>

   <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm font-black text-stone-700">
    Hiện ví dụ ở mặt sau
    <input
     type="checkbox"
     checked={props.showExamples}
     onChange={(event) => props.onShowExamplesChange(event.target.checked)}
     className="h-5 w-5 accent-red-500"
    />
   </label>

   <div className="mt-4 rounded-2xl border-2 border-blue-100 bg-blue-50 p-3">
    <div className="flex items-center justify-between gap-2">
     <p className="text-xs font-black uppercase tracking-wide text-blue-700">
      Tự phát
     </p>
     <button
      type="button"
      onClick={() => props.onAutoplayEnabledChange(!props.autoplayEnabled)}
      className={cn(
       "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black",
       props.autoplayEnabled
        ? "bg-red-500 text-white"
        : "bg-white text-blue-700 shadow-theme-sm",
      )}
     >
      {props.autoplayEnabled ? (
       <Pause className="h-4 w-4" />
      ) : (
       <Play className="h-4 w-4" />
      )}
      {props.autoplayEnabled ? "Dừng" : "Chạy"}
     </button>
    </div>
    <div className="mt-3 grid gap-2">
     <Select
      value={String(props.autoplayInterval)}
      onChange={(event) =>
       props.onAutoplayIntervalChange(Number(event.target.value))
      }
     >
      <option value="3">3 giây</option>
      <option value="5">5 giây</option>
      <option value="8">8 giây</option>
      <option value="12">12 giây</option>
     </Select>
     <Select
      value={props.autoplayBehavior}
      onChange={(event) =>
       props.onAutoplayBehaviorChange(event.target.value as AutoplayBehavior)
      }
     >
      <option value="flipNext">Lật rồi chuyển</option>
      <option value="frontOnly">Chỉ chuyển mặt trước</option>
      <option value="speakFlipNext">Đọc + lật + chuyển</option>
     </Select>
    </div>
   </div>

   <button
    type="button"
    onClick={props.onResetFilteredProgress}
    className="mt-3 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
   >
    Reset tiến độ bộ lọc
   </button>
  </aside>
 );
}

export function FlashcardMode({
 activeEntry,
 cardIndex,
 total,
 revealed,
 frontMode,
 showExamples,
 onReveal,
 onSpeak,
 onEdit,
 onAgain,
 onReview,
 onRemember,
 onPrevious,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 revealed: boolean;
 frontMode: FlashFrontMode;
 showExamples: boolean;
 onReveal: () => void;
 onSpeak: () => void;
 onEdit: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
 onPrevious: () => void;
}) {
 return (
  <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col items-center overflow-x-hidden">
   <div className="rounded-full bg-white px-4 py-1.5 text-lg font-black text-stone-800 shadow-theme-sm">
    {Math.min(cardIndex + 1, total)} / {total}
   </div>
   <div className="relative mt-4 w-full max-w-3xl min-w-0">
    <div className="absolute inset-0 rotate-[-4deg] rounded-[36px] border-2 border-stone-100 bg-white/70" />
    <div className="absolute inset-0 rotate-3 rounded-[36px] border-2 border-stone-100 bg-white/80" />
    <div className="relative flex h-[clamp(430px,52vh,560px)] min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[32px] border-2 border-stone-100 bg-white p-5 shadow-theme-md md:p-6">
     <div className="flex items-center justify-between text-stone-800">
      <button
       type="button"
       className="rounded-full p-2 hover:bg-stone-50"
       title="Yêu thích"
      >
       <Heart className="h-7 w-7" />
      </button>
      <span className="text-lg font-black text-stone-500">
       {Math.min(cardIndex + 1, total)} / {total}
      </span>
      <button
       type="button"
       onClick={onSpeak}
       className="rounded-full p-2 hover:bg-stone-50"
       title="Phát âm"
      >
       <Volume2 className="h-7 w-7" />
      </button>
     </div>
     {!revealed ? (
      <button
       type="button"
       onClick={onReveal}
       className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[24px] py-8 transition hover:bg-stone-50/70"
      >
       <h3 className="max-w-full break-words text-center text-[clamp(4.5rem,22vw,7rem)] font-black leading-tight text-red-500 [overflow-wrap:anywhere] md:text-[clamp(3.5rem,7vw,6rem)]">
        {getFrontText(activeEntry, frontMode)}
       </h3>
       <p className="mt-7 text-center text-lg font-black text-stone-500 md:text-xl">
        {frontMode === "hanzi"
         ? "Tự đoán pinyin và nghĩa trước khi lật thẻ."
         : "Tự đoán Hán tự trước khi lật thẻ."}
       </p>
       <p className="mt-3 text-sm font-black uppercase tracking-wide text-stone-400">
        Space · Bấm thẻ để xem đáp án
       </p>
      </button>
     ) : (
      <FlashcardBack
       onReveal={onReveal}
       entry={activeEntry}
       onSpeak={onSpeak}
       onEdit={onEdit}
       showExamples={showExamples}
       compact
      />
     )}
    </div>
   </div>
   <div className="mt-5 flex flex-wrap justify-center gap-3 md:gap-4">
    <RoundStudyButton icon={Search} label="Chi tiết" onClick={onEdit} />
    <RoundStudyButton icon={RotateCcw} label="Lùi" onClick={onPrevious} />
    <RoundStudyButton
     icon={revealed ? Eye : Play}
     label={revealed ? "Ẩn đáp án" : "Xem đáp án"}
     onClick={onReveal}
     primary
    />
    <RoundStudyButton
     icon={XCircle}
     label="Chưa nhớ"
     onClick={onAgain}
     danger
    />
    <RoundStudyButton
     icon={HelpCircle}
     label="Cần ôn"
     onClick={onReview}
     warning
    />
    <RoundStudyButton
     icon={Check}
     label="Đã nhớ"
     onClick={onRemember}
     success
    />
   </div>
  </div>
 );
}

function RoundStudyButton({
 icon: Icon,
 label,
 onClick,
 primary,
 danger,
 warning,
 success,
}: {
 icon: LucideIcon;
 label: string;
 onClick: () => void;
 primary?: boolean;
 danger?: boolean;
 warning?: boolean;
 success?: boolean;
}) {
 return (
  <button
   type="button"
   title={label}
   onClick={onClick}
   className={cn(
    "flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-theme-md transition hover:-translate-y-0.5 md:h-16 md:w-16",
    primary && "text-blue-900",
    danger && "text-red-400",
    warning && "text-yellow-500",
    success && "text-emerald-600",
    !primary && !danger && !warning && !success && "text-stone-900",
   )}
  >
   <Icon
    className="h-7 w-7 md:h-8 md:w-8"
    fill={primary ? "currentColor" : "none"}
   />
  </button>
 );
}

function FlashcardFocusMode({
 activeEntry,
 cardIndex,
 total,
 revealed,
 frontMode,
 showExamples,
 onReveal,
 onSpeak,
 onEdit,
 onAgain,
 onReview,
 onRemember,
 onPrevious,
 onSelectCard,
 entries,
}: Parameters<typeof FlashcardMode>[0] & {
 onSelectCard: (index: number) => void;
 entries: VocabEntryWithProgress[];
}) {
 const nextDisabled = total <= 1;
 const touchStartRef = useRef<{ x: number; y: number } | null>(null);
 const [writerCharIndex, setWriterCharIndex] = useState(0);
 const showInlineWriter = isHskEntry(activeEntry);
 const nextCard = useCallback(() => {
  if (!nextDisabled) onSelectCard((cardIndex + 1) % total);
 }, [cardIndex, nextDisabled, onSelectCard, total]);

 useEffect(() => {
  setWriterCharIndex(0);
 }, [activeEntry.id]);

 const actionBar = (
  <div
   className={cn(
    "mx-auto mb-3 grid w-full max-w-full min-w-0 gap-2 md:mb-4 md:gap-3",
    revealed
     ? "grid-cols-3 sm:max-w-[1180px] md:grid-cols-5"
     : "grid-cols-3 sm:max-w-[760px]",
   )}
  >
   <button
    type="button"
    onClick={onPrevious}
    disabled={nextDisabled}
    className="h-12 min-w-0 rounded-2xl border-2 border-stone-200 bg-white px-2 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 disabled:opacity-50 sm:px-4"
   >
    <span className="hidden sm:inline">← Trước</span>
    <span className="sm:hidden">←</span>
   </button>
   {!revealed && (
    <button
     type="button"
     onClick={onReveal}
     className="h-12 min-w-0 rounded-2xl bg-red-500 px-2 text-sm font-black text-white shadow-theme-sm hover:bg-red-600 sm:px-4"
    >
     <span className="hidden sm:inline">Xem đáp án</span>
     <span className="sm:hidden">Xem</span>
    </button>
   )}
   <button
    type="button"
    onClick={nextCard}
    disabled={nextDisabled}
    className="h-12 min-w-0 rounded-2xl border-2 border-stone-200 bg-white px-2 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 disabled:opacity-50 sm:px-4"
   >
    <span className="hidden sm:inline">Tiếp →</span>
    <span className="sm:hidden">→</span>
   </button>
   {revealed && (
    <>
     <button
      type="button"
      onClick={onRemember}
      className="h-12 min-w-0 rounded-2xl bg-emerald-600 px-2 text-sm font-black text-white shadow-theme-sm hover:bg-emerald-700 sm:px-4"
     >
      <span className="hidden sm:inline">Đã biết</span>
      <span className="sm:hidden">Biết</span>
     </button>
     <button
      type="button"
      onClick={onAgain}
      className="h-12 min-w-0 rounded-2xl border-2 border-stone-200 bg-white px-2 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 sm:px-4"
     >
      <span className="hidden sm:inline">Học lại</span>
      <span className="sm:hidden">Lại</span>
     </button>
     <button
      type="button"
      onClick={onReview}
      className="h-12 min-w-0 rounded-2xl border-2 border-stone-200 bg-white px-2 text-sm font-black text-stone-900 shadow-theme-sm hover:bg-stone-50 sm:px-4"
     >
      <span className="hidden sm:inline">Còn khó</span>
      <span className="sm:hidden">Khó</span>
     </button>
    </>
   )}
  </div>
 );

 return (
  <div className="mx-auto flex w-full max-w-full min-w-0 flex-col justify-center overflow-x-hidden">
   {actionBar}
   <div className={cn("relative mx-auto w-full max-w-full min-w-0", revealed ? "sm:max-w-[1180px]" : "sm:max-w-[760px]")}>
    <div className="absolute inset-x-8 top-3 bottom-0 hidden rotate-[-3deg] rounded-[30px] border border-stone-100 bg-white/70 sm:block" />
    <div className="absolute inset-x-8 top-3 bottom-0 hidden rotate-2 rounded-[30px] border border-stone-100 bg-white/80 sm:block" />
    <div
     onTouchStart={(event) => {
      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
     }}
     onTouchEnd={(event) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) nextCard();
      else onPrevious();
     }}
     className={cn(
      "relative flex w-full max-w-full min-w-0 flex-col overflow-hidden rounded-[28px] border border-stone-200 bg-white p-4 shadow-theme-md touch-pan-y sm:p-5 md:rounded-[32px]",
      revealed ? "min-h-[420px]" : "min-h-[360px] sm:min-h-[420px]",
     )}
    >
     {!revealed ? (
      <>
      <button
       type="button"
       onClick={onReveal}
       className="flex min-h-[260px] w-full max-w-full min-w-0 flex-1 flex-col items-center justify-center overflow-x-hidden rounded-[22px] bg-stone-50/70 px-3 py-6 transition hover:bg-stone-50 md:rounded-[28px] md:px-4 md:py-8"
      >
        <div className="flex flex-1 flex-col items-center justify-center">
         <p className="mb-4 rounded-full bg-white px-3 py-1 text-xs font-black text-stone-500 shadow-theme-sm">
          {Math.min(cardIndex + 1, total)} / {total}
         </p>
         <h3 className="max-w-full break-words text-center text-[clamp(4.5rem,24vw,8rem)] font-black leading-tight text-red-500 [overflow-wrap:anywhere] md:text-[clamp(4rem,8vw,6.5rem)]">
          {getFrontText(activeEntry, frontMode)}
         </h3>
         {showInlineWriter && (
          <InlineHskWritingPanel
           entry={activeEntry}
           activeIndex={writerCharIndex}
           onIndexChange={setWriterCharIndex}
          />
         )}
        </div>
       </button>
      </>
     ) : (
      <>
       <FlashcardBack
        entry={activeEntry}
        onSpeak={onSpeak}
        onEdit={onEdit}
        showExamples={showExamples}
        compact
       />
      </>
     )}
    </div>
   </div>
  </div>
 );
}

export function QuickWordChips({
 entries,
 activeEntryId,
 onSelect,
 expanded = false,
}: {
 entries: VocabEntryWithProgress[];
 activeEntryId?: string;
 onSelect: (index: number) => void;
 expanded?: boolean;
}) {
 if (!entries.length) return null;
 return (
  <div
   className={cn(
    "text-left",
    !expanded && "mt-5 border-t-2 border-stone-100 pt-4",
   )}
  >
   <div className="flex min-w-0 items-center justify-between gap-3">
    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
     Nhảy nhanh
    </p>
    <p className="text-xs font-bold text-stone-400">
     {entries.length} thẻ trong bộ lọc
    </p>
   </div>
   <div
    className={cn(
     "mt-3 flex max-w-full flex-wrap gap-2 overflow-y-auto overflow-x-hidden pr-1",
     expanded ? "max-h-[70vh]" : "max-h-28",
    )}
   >
    {entries.map((entry, index) => (
     <button
      key={entry.id}
      type="button"
      onClick={() => onSelect(index)}
      className={cn(
       "max-w-full truncate rounded-full border-2 px-3 py-1.5 text-sm font-black transition",
       entry.id === activeEntryId
        ? "border-red-500 bg-red-500 text-white"
        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
      )}
     >
      {entry.hanzi}
     </button>
    ))}
   </div>
  </div>
 );
}

function isHskEntry(entry: VocabEntryWithProgress) {
 const hskLevel = String(entry.ai_analysis.hsk_level || "").toLowerCase();
 return (
  entry.source.courseKey.toLowerCase().includes("hsk") ||
  entry.ai_analysis.source_metadata?.course_key
   ?.toLowerCase()
   .includes("hsk") ||
  hskLevel.startsWith("hsk")
 );
}

export function InlineHskWritingPanel({
 entry,
 activeIndex,
 onIndexChange,
}: {
 entry: VocabEntryWithProgress;
 activeIndex: number;
 onIndexChange: (index: number) => void;
}) {
 const characters = getStudyCharacters(entry);
 const activeChar = characters[activeIndex] || characters[0];
 if (!activeChar) return null;

 return (
  <section className="w-full max-w-full min-w-0 overflow-x-hidden">
   <div className="mb-4 flex max-w-full flex-wrap justify-center gap-2">
    {characters.map((character, index) => (
     <button
      key={`${character}-${index}`}
      type="button"
      onClick={(event) => {
       event.stopPropagation();
       onIndexChange(index);
      }}
      className={cn(
       "flex h-10 min-w-10 max-w-full items-center justify-center rounded-xl border-2 px-3 text-lg font-black shadow-theme-sm transition",
       index === activeIndex
        ? "border-red-500 bg-red-500 text-white"
        : "border-stone-200 bg-white text-stone-900 hover:bg-stone-50",
      )}
     >
      {character}
     </button>
    ))}
   </div>
   <div
    className="flex w-full max-w-full justify-center overflow-hidden md:shrink-0"
    onClick={(event) => event.stopPropagation()}
    onTouchStart={(event) => event.stopPropagation()}
    onTouchEnd={(event) => event.stopPropagation()}
   >
    <CharacterWriterCard character={activeChar} />
   </div>
  </section>
 );
}

function FlashcardBack({
 entry,
 onSpeak,
 onEdit,
 compact,
 onReveal,
 showExamples = true,
}: {
 entry: VocabEntryWithProgress;
 onSpeak: () => void;
 onEdit: () => void;
 compact?: boolean;
 onReveal?: () => void;
 showExamples?: boolean;
}) {
 const analysis = entry.ai_analysis;
 const example = getPrimaryExample(entry);
 const examples = (analysis.examples || []).slice(0, 3);
 const [activeIndex, setActiveIndex] = useState(0);

 if (compact) {
  return (
   <div
    className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-1 py-2 md:overflow-hidden md:py-3"
    onClick={onReveal}
   >
    <div className="grid min-h-0 w-full max-w-full min-w-0 flex-1 gap-3 overflow-x-hidden text-left md:overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
     <section className="flex min-h-0 w-full max-w-full min-w-0 flex-col gap-3 overflow-y-visible overflow-x-hidden rounded-[22px] bg-stone-50/70 p-3 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent] md:overflow-y-auto md:rounded-[26px] md:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
       <div className="min-w-0 flex-1 text-center lg:text-left">
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center">
         <h3 className="max-w-full break-words text-[clamp(4.5rem,22vw,6rem)] font-black leading-none text-red-500 [overflow-wrap:anywhere] md:text-[clamp(3rem,7vw,5.6rem)]">
          {entry.hanzi}
         </h3>

         <p className="max-w-full break-words text-center text-xl font-black leading-tight text-stone-900 [overflow-wrap:anywhere] md:text-2xl lg:mt-3 lg:text-left">
          {entry.pinyin}
          {entry.sino_vietnamese || analysis.han_viet
           ? ` - ${(entry.sino_vietnamese || analysis.han_viet || "").toUpperCase()}`
           : ""}
         </p>
        </div>

        <p className="mt-3 break-words text-base font-black leading-7 text-stone-800 [overflow-wrap:anywhere] md:text-lg">
         {getMeaning(entry)}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
         {entry.word_type && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-700 shadow-theme-sm">
           {entry.word_type}
          </span>
         )}
         <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 shadow-theme-sm">
          Level {getFlashLevel(entry)}
         </span>
        </div>
       </div>
       <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
        <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
       </div>
      </div>

      {analysis.decomposition && (
       <section className="break-words rounded-[20px] bg-yellow-50 p-3 text-sm font-bold leading-6 text-stone-700 [overflow-wrap:anywhere] md:rounded-[22px] md:p-4">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-orange-600">
         Chiết tự
        </p>
        {analysis.decomposition}
       </section>
      )}

      {!!analysis.collocations?.length && (
       <section className="rounded-[20px] bg-white p-3 shadow-theme-sm md:rounded-[22px] md:p-4">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Cụm hay gặp
        </p>
        <div className="mt-2 flex max-w-full flex-wrap gap-2">
         {analysis.collocations.map((item) => (
          <span
           key={item}
           className="max-w-full break-words rounded-full bg-stone-50 px-3 py-1 text-sm font-black text-stone-700 [overflow-wrap:anywhere]"
          >
           {item}
          </span>
         ))}
        </div>
       </section>
      )}
      {getCompactNote(entry) && (
       <section className="break-words rounded-[22px] bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800 [overflow-wrap:anywhere]">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-blue-500">
         Lưu ý nhanh
        </p>
        {getCompactNote(entry)}
       </section>
      )}
     </section>

     <section className="flex min-h-0 w-full max-w-full min-w-0 flex-col gap-3 overflow-y-visible overflow-x-hidden pr-0 [scrollbar-width:thin] [scrollbar-color:#d6d3d1_transparent] md:overflow-y-auto md:pr-1">
      {showExamples && examples.length ? (
       <section className="grid gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Ví dụ
        </p>
        {examples.map((item, index) => (
         <div
          key={`${item.zh}-${index}`}
          className={cn(
           "max-w-full overflow-x-hidden rounded-[18px] bg-white p-3 shadow-theme-sm",
           index === 0 && "border border-stone-100",
          )}
         >
          <p
           className={cn(
            "break-words font-black leading-7 text-stone-900 [overflow-wrap:anywhere]",
            index === 0 ? "text-base md:text-lg" : "text-sm md:text-base",
           )}
          >
           {item.zh}
          </p>
          {item.pinyin ? (
           <p className="break-words pt-1 text-sm font-bold leading-6 text-stone-500 [overflow-wrap:anywhere]">
            {item.pinyin}
           </p>
          ) : null}
          {item.vi ? (
           <p className="break-words pt-1 text-sm font-bold leading-6 text-stone-800 [overflow-wrap:anywhere] md:text-base md:leading-7">
            {item.vi}
           </p>
          ) : null}
          {item.note ? (
           <p className="mt-2 break-words rounded-2xl bg-stone-50 p-2 text-xs font-bold leading-5 text-stone-600 [overflow-wrap:anywhere]">
            {item.note}
           </p>
          ) : null}
         </div>
        ))}
       </section>
      ) : null}
      <InlineHskWritingPanel
       entry={entry}
       activeIndex={activeIndex}
       onIndexChange={setActiveIndex}
      />
      {!!analysis.comparisons?.length && (
       <section className="max-w-full overflow-x-hidden rounded-[22px] bg-stone-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         So sánh nhanh
        </p>
        <ul className="mt-2 space-y-2 text-sm font-bold leading-6 text-stone-700">
         {analysis.comparisons.map((comparison) => (
          <li key={comparison}>{comparison}</li>
         ))}
        </ul>
       </section>
      )}
      {analysis.cultural_note && (
      <section className="break-words rounded-[22px] bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800 [overflow-wrap:anywhere]">
        <p className="mb-1 text-xs font-black uppercase tracking-wide text-emerald-600">
         Trung Việt
        </p>
       {analysis.cultural_note}
      </section>
      )}
     </section>
    </div>
   </div>
  );
 }
 return (
  <div className="mx-auto mt-6 grid w-full max-w-full min-w-0 gap-4 overflow-x-hidden text-left xl:grid-cols-[0.9fr_1.1fr]">
   <div className="min-w-0 overflow-hidden rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm sm:p-5">
    <div className="flex min-w-0 items-start justify-between gap-3">
     <div className="min-w-0">
      <p className="break-words text-2xl font-black text-red-500 [overflow-wrap:anywhere]">{entry.pinyin}</p>
      {(entry.sino_vietnamese || analysis.han_viet) && (
       <p className="mt-1 break-words text-sm font-black text-stone-500 [overflow-wrap:anywhere]">
        Hán Việt: {entry.sino_vietnamese || analysis.han_viet}
       </p>
      )}
     </div>
     <div className="flex shrink-0 gap-2">
      <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
      <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
     </div>
    </div>
    {entry.word_type && (
     <span className="mt-4 inline-flex max-w-full rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
      {entry.word_type}
     </span>
    )}
    <p className="mt-4 break-words text-lg font-black leading-8 text-stone-800">
     {getMeaning(entry)}
    </p>
    {analysis.decomposition && (
     <div className="mt-4 min-w-0 overflow-hidden rounded-2xl bg-yellow-50 p-3">
      <p className="text-xs font-black uppercase text-orange-600">Chiết tự</p>
      <p className="mt-1 break-words text-sm font-bold leading-6 text-stone-700 [overflow-wrap:anywhere]">
       {analysis.decomposition}
      </p>
     </div>
    )}
   </div>

   <div className="min-w-0 overflow-hidden rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm sm:p-5">
    {!!analysis.collocations?.length && (
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
       Cụm hay gặp
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
       {analysis.collocations.slice(0, 4).map((collocation) => (
        <span
         key={collocation}
         className="max-w-full break-words rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-700 [overflow-wrap:anywhere]"
        >
         {collocation}
        </span>
       ))}
      </div>
     </div>
    )}
    {showExamples && example && (
     <div className="mt-5 min-w-0 overflow-hidden rounded-2xl bg-stone-50 p-4">
      <p className="break-words text-sm font-black leading-6 text-stone-900 [overflow-wrap:anywhere]">
       {example.zh}
      </p>
      <p className="mt-1 break-words text-xs font-bold text-red-500 [overflow-wrap:anywhere]">{example.pinyin}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-stone-600">
       {example.vi}
      </p>
      {example.note && (
       <p className="mt-2 break-words text-xs font-bold leading-5 text-stone-500">
        → {example.note}
       </p>
      )}
     </div>
    )}
    {(analysis.usage_note || analysis.cultural_note) && (
     <div className="mt-5 grid gap-2">
      {analysis.usage_note && (
       <p className="break-words rounded-2xl bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-700 [overflow-wrap:anywhere]">
        Lưu ý: {analysis.usage_note}
       </p>
      )}
      {analysis.cultural_note && (
       <p className="break-words rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-700 [overflow-wrap:anywhere]">
        Trung Việt: {analysis.cultural_note}
       </p>
      )}
     </div>
    )}
    <Link
     href={`/dictionary/${encodeURIComponent(entry.hanzi)}`}
     className="mt-5 inline-flex h-11 max-w-full items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     Xem đủ 7 phần
     <ChevronRight className="h-4 w-4" />
    </Link>
   </div>
  </div>
 );
}
