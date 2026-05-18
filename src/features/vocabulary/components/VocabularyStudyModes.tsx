"use client";

import {
 Edit3,
 PenLine,
 Volume2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import {
 ActionButton,
 IconToolButton,
 StudyMeta,
} from "@/features/vocabulary/components/VocabularyStudyPrimitives";
import { EmptyState } from "@/features/vocabulary/components/VocabularyManagementPanels";
import {
 getFlashStatus,
 getMeaning,
 getPrimaryExample,
 getStudyCharacters,
} from "@/features/vocabulary/utils/vocab-study";
import { cn } from "@/lib/utils";
import type { VocabEntryWithProgress } from "@/types/database";

const answerLabels = ["A", "B", "C", "D"];

function VocabListStudyMode({
 entries,
 activeEntryId,
 onSelect,
 onEdit,
}: {
 entries: VocabEntryWithProgress[];
 activeEntryId?: string;
 onSelect: (index: number) => void;
 onEdit: () => void;
}) {
 return (
  <div className="mx-auto w-full max-w-6xl text-left">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-red-500">
      Danh sách từ
     </p>
     <h3 className="mt-1 text-2xl font-black text-stone-900">
      {entries.length} thẻ trong bộ lọc
     </h3>
    </div>
    <ActionButton onClick={onEdit} icon={Edit3} tone="neutral">
     Sửa thẻ đang chọn
    </ActionButton>
   </div>
   <div className="mt-4 grid max-h-[min(620px,65dvh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
    {entries.map((entry, index) => {
     const active = entry.id === activeEntryId;
     const example = getPrimaryExample(entry);
     return (
      <button
       key={entry.id}
       type="button"
       onClick={() => onSelect(index)}
       className={cn(
        "rounded-[22px] border-2 bg-white p-4 text-left shadow-theme-sm transition hover:border-red-300",
        active ? "border-red-500 bg-red-50/50" : "border-stone-200",
       )}
      >
       <div className="flex items-start justify-between gap-3">
        <div>
         <p className="text-3xl font-black leading-none text-red-500">
          {entry.hanzi}
         </p>
         <p className="mt-2 text-sm font-black text-stone-900">
          {entry.pinyin}
          {entry.sino_vietnamese ? ` - ${entry.sino_vietnamese}` : ""}
         </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-black text-stone-600">
         {getFlashStatus(entry)}
        </span>
       </div>
       <p className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-stone-700">
        {getMeaning(entry)}
       </p>
       {example && (
        <p className="mt-3 line-clamp-2 rounded-2xl bg-stone-50 p-2 text-xs font-bold leading-5 text-stone-500">
         {example.zh} · {example.vi}
        </p>
       )}
      </button>
     );
    })}
   </div>
  </div>
 );
}

function ExamplesMode({
 activeEntry,
 cardIndex,
 total,
 onPrevious,
 onNext,
 onSpeak,
 onEdit,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 onPrevious: () => void;
 onNext: () => void;
 onSpeak: () => void;
 onEdit: () => void;
}) {
 const examples = (activeEntry.ai_analysis.examples || []).slice(0, 3);
 return (
  <div className="mx-auto w-full max-w-5xl text-left">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mt-5 rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-sm md:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-red-500">
       Luyện câu ví dụ
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
       <h3 className="text-5xl font-black leading-none text-red-500 md:text-6xl">
        {activeEntry.hanzi}
       </h3>
       <div>
        <p className="text-xl font-black text-stone-900">
         {activeEntry.pinyin}
        </p>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {getMeaning(activeEntry)}
        </p>
       </div>
      </div>
     </div>
     <div className="flex gap-2">
      <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
      <IconToolButton icon={PenLine} label="Sửa" onClick={onEdit} />
     </div>
    </div>

    <div className="mt-5 grid gap-3">
     {examples.length ? (
      examples.map((example, index) => (
       <article
        key={`${example.zh}-${index}`}
        className="rounded-[22px] border-2 border-stone-100 bg-stone-50 p-4 md:p-5"
       >
        <p className="text-xs font-black uppercase tracking-wide text-stone-400">
         Ví dụ {index + 1}
        </p>
        <p className="mt-2 text-xl font-black leading-8 text-stone-900">
         {example.zh}
        </p>
        {example.pinyin && (
         <p className="mt-2 text-sm font-bold leading-6 text-red-500">
          {example.pinyin}
         </p>
        )}
        {example.vi && (
         <p className="mt-2 text-base font-bold leading-7 text-stone-700">
          {example.vi}
         </p>
        )}
        {example.note && (
         <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-stone-600">
          {example.note}
         </p>
        )}
       </article>
      ))
     ) : (
      <EmptyState
       title="Từ này chưa có ví dụ"
       description="Mở drawer sửa từ để thêm câu ví dụ vào 7 phần dữ liệu."
       compact
      />
     )}
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
     <ActionButton onClick={onPrevious} tone="neutral">
      ← Trước
     </ActionButton>
     <ActionButton onClick={onNext}>Tiếp →</ActionButton>
    </div>
   </div>
  </div>
 );
}

function GuessMode({
 activeEntry,
 cardIndex,
 total,
 guessInput,
 guessState,
 hintLevel,
 onGuessInputChange,
 onCheckGuess,
 onHint,
 onSpeak,
 onAgain,
 onReview,
 onRemember,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 guessInput: string;
 guessState: "idle" | "correct" | "wrong";
 hintLevel: number;
 onGuessInputChange: (value: string) => void;
 onCheckGuess: () => void;
 onHint: () => void;
 onSpeak: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
}) {
 const example = getPrimaryExample(activeEntry);
 const hiddenExample = example?.zh?.replaceAll(activeEntry.hanzi, "____");
 const hints = [
  `${activeEntry.hanzi.length} chữ Hán`,
  activeEntry.pinyin ? `Pinyin: ${activeEntry.pinyin}` : "",
  activeEntry.sino_vietnamese ? `Hán Việt: ${activeEntry.sino_vietnamese}` : "",
  activeEntry.hanzi ? `Chữ đầu: ${activeEntry.hanzi.slice(0, 1)}` : "",
 ].filter(Boolean);
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    <p className="mt-4 text-sm font-black uppercase tracking-wide text-stone-500">
     Định nghĩa
    </p>
    <p className="mx-auto mt-2 max-w-2xl text-2xl font-black leading-9 text-red-500">
     {getMeaning(activeEntry)}
    </p>
    {hiddenExample && (
     <div className="mx-auto mt-5 max-w-2xl rounded-2xl bg-stone-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-stone-500">
       Ví dụ
      </p>
      <p className="mt-2 text-base font-black leading-7 text-stone-800">
       {hiddenExample}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-500">{example?.vi}</p>
     </div>
    )}
    {hintLevel > 0 && (
     <div className="mx-auto mt-5 max-w-lg rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-orange-600">
       Gợi ý
      </p>
      <ul className="mt-2 space-y-1 text-sm font-bold text-stone-700">
       {hints.slice(0, hintLevel).map((hint) => (
        <li key={hint}>• {hint}</li>
       ))}
      </ul>
     </div>
    )}
    {guessState !== "idle" && (
     <div
      className={cn(
       "mx-auto mt-5 max-w-lg rounded-2xl border-2 p-4",
       guessState === "correct"
        ? "border-emerald-300 bg-emerald-50"
        : "border-red-300 bg-red-50",
      )}
     >
      <p className="text-sm font-black text-stone-800">
       Đáp án: {activeEntry.hanzi} · {activeEntry.pinyin}
      </p>
      <p className="mt-1 text-sm font-bold text-stone-600">
       {getMeaning(activeEntry)}
      </p>
     </div>
    )}
    <form
     className="mx-auto mt-6 max-w-2xl"
     onSubmit={(event) => {
      event.preventDefault();
      onCheckGuess();
     }}
    >
     <Input
      value={guessInput}
      onChange={(event) => onGuessInputChange(event.target.value)}
      placeholder="Nhập Hán tự..."
      disabled={guessState !== "idle"}
      className="h-16 rounded-2xl border-4 border-red-400 bg-white text-center text-2xl font-black text-stone-900 shadow-theme-sm"
     />
     {guessState === "idle" ? (
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
       <ActionButton onClick={onAgain} tone="neutral">
        Không biết
       </ActionButton>
       <ActionButton onClick={onHint} tone="neutral">
        H · Gợi ý
       </ActionButton>
       <ActionButton onClick={onCheckGuess}>Kiểm tra</ActionButton>
      </div>
     ) : (
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
       <ActionButton onClick={onAgain} tone="neutral">
        Chưa nhớ
       </ActionButton>
       <ActionButton onClick={onReview} tone="neutral">
        Cần ôn
       </ActionButton>
       <ActionButton onClick={onRemember}>Đã nhớ</ActionButton>
      </div>
     )}
    </form>
   </div>
  </div>
 );
}

function QuizMode({
 activeEntry,
 mode,
 cardIndex,
 total,
 quizOptions,
 selectedAnswerId,
 answerChecked,
 onChooseAnswer,
 onContinueQuiz,
 onSpeak,
}: {
 activeEntry: VocabEntryWithProgress;
 mode: "quiz" | "reverse";
 cardIndex: number;
 total: number;
 quizOptions: VocabEntryWithProgress[];
 selectedAnswerId: string | null;
 answerChecked: boolean;
 onChooseAnswer: (entry: VocabEntryWithProgress) => void;
 onContinueQuiz: () => void;
 onSpeak: () => void;
}) {
 const reverse = mode === "reverse";
 const selected = quizOptions.find((entry) => entry.id === selectedAnswerId);
 const correct = selectedAnswerId === activeEntry.id;
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    <h3
     className={cn(
      "mx-auto mt-4 max-w-2xl font-black leading-tight",
      reverse ? "text-6xl text-red-500" : "text-3xl text-blue-500",
     )}
    >
     {reverse ? activeEntry.hanzi : getMeaning(activeEntry)}
    </h3>
    <p className="mt-4 text-lg font-bold text-stone-600">
     {reverse ? activeEntry.pinyin : "Chọn Hán tự đúng"}
    </p>
    <div className="mx-auto mt-8 grid max-w-3xl gap-3">
     {quizOptions.map((option, index) => {
      const isSelected = selectedAnswerId === option.id;
      const isCorrect = option.id === activeEntry.id;
      return (
       <button
        key={option.id}
        type="button"
        onClick={() => onChooseAnswer(option)}
        disabled={answerChecked}
        className={cn(
         "flex min-h-20 items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-theme-sm transition",
         answerChecked && isCorrect && "border-emerald-400 bg-emerald-50",
         answerChecked &&
          isSelected &&
          !isCorrect &&
          "border-red-400 bg-red-50",
         !answerChecked &&
          "border-stone-200 hover:border-red-300 hover:bg-red-50/30",
        )}
       >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-lg font-black text-stone-600">
         {answerLabels[index]}
        </span>
        <span>
         <span className="block text-2xl font-black text-red-500">
          {reverse ? getMeaning(option) : option.hanzi}
         </span>
         <span className="mt-1 block text-sm font-bold leading-6 text-stone-500">
          {reverse
           ? answerChecked
             ? option.hanzi
             : "Chọn nghĩa phù hợp"
           : option.pinyin}
         </span>
         {!reverse && answerChecked && (
          <span className="mt-1 block text-sm font-bold text-stone-500">
           {getMeaning(option)}
          </span>
         )}
        </span>
       </button>
      );
     })}
    </div>
    {answerChecked && (
     <div
      className={cn(
       "mx-auto mt-5 max-w-3xl rounded-2xl border-2 p-4 text-left",
       correct
        ? "border-emerald-300 bg-emerald-50"
        : "border-red-300 bg-red-50",
      )}
     >
      <p className="text-sm font-black text-stone-900">
       {correct ? "Đúng rồi" : `Chưa đúng. Đáp án: ${activeEntry.hanzi}`}
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-600">
       {getMeaning(activeEntry)}
      </p>
      {selected && !correct && (
       <p className="mt-1 text-xs font-bold text-stone-500">
        Bạn chọn: {selected.hanzi} · {getMeaning(selected)}
       </p>
      )}
      <div className="mt-4">
       <ActionButton onClick={onContinueQuiz}>
        {correct ? "Tiếp tục" : "Ghi vào cần ôn"}
       </ActionButton>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

function WriteMode({
 activeEntry,
 cardIndex,
 total,
 writeCharIndex,
 onWriteCharIndexChange,
 onSpeak,
 onAgain,
 onReview,
 onRemember,
}: {
 activeEntry: VocabEntryWithProgress;
 cardIndex: number;
 total: number;
 writeCharIndex: number;
 onWriteCharIndexChange: (index: number) => void;
 onSpeak: () => void;
 onAgain: () => void;
 onReview: () => void;
 onRemember: () => void;
}) {
 const characters = getStudyCharacters(activeEntry);
 const activeChar =
  characters[writeCharIndex] || characters[0] || activeEntry.hanzi.slice(0, 1);
 return (
  <div className="mx-auto w-full max-w-4xl">
   <StudyMeta entry={activeEntry} cardIndex={cardIndex} total={total} />
   <div className="mx-auto mt-6 rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-8">
    <h3 className="text-5xl font-black text-red-500 md:text-6xl">
     {activeEntry.hanzi}
    </h3>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-lg font-black text-stone-600">
     <span>{activeEntry.pinyin}</span>
     <IconToolButton icon={Volume2} label="Phát âm" onClick={onSpeak} />
    </div>
    <p className="mx-auto mt-3 max-w-2xl text-lg font-bold leading-8 text-stone-600">
     {getMeaning(activeEntry)}
    </p>
    <div className="mt-7 flex flex-wrap justify-center gap-2">
     {characters.map((character, index) => (
      <button
       key={`${character}-${index}`}
       type="button"
       onClick={() => onWriteCharIndexChange(index)}
       className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-xl font-black shadow-theme-sm",
        index === writeCharIndex
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
       )}
      >
       {character}
      </button>
     ))}
    </div>
    <div className="mx-auto mt-6 flex justify-center">
     <CharacterWriterCard character={activeChar} />
    </div>
    <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
     <ActionButton onClick={onAgain} tone="neutral">
      Chưa nhớ
     </ActionButton>
     <ActionButton onClick={onReview} tone="neutral">
      Cần ôn
     </ActionButton>
     <ActionButton onClick={onRemember}>Đã nhớ</ActionButton>
    </div>
   </div>
  </div>
 );
}

export { ExamplesMode, GuessMode, QuizMode, VocabListStudyMode, WriteMode };
