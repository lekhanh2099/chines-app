"use client";

import type { ReactNode } from "react";
import {
 BookOpen,
 Check,
 CheckCircle2,
 FileText,
 Layers3,
 XCircle,
 type LucideIcon,
} from "lucide-react";
import {
 ActionButton,
 EmptyState,
 StatusPill,
} from "@/features/grammar/components/ui";
import { getCoachQuiz } from "@/features/grammar/utils/exercise";
import { getCoachCore } from "@/features/grammar/utils/point";
import { cn } from "@/lib/utils";
import type {
 GrammarLessonWithStats,
 GrammarPointWithProgress,
} from "@/types/database";

export type CoachTab = "logic" | "formula" | "examples" | "traps" | "practice";

export function GrammarCoachCard({
 point,
 lesson,
 index,
 total,
 activeTab,
 selectedChoice,
 checked,
 correct,
 isGeneratingExercises,
 onTabChange,
 onSelectChoice,
 onCheckPractice,
 onPrev,
 onNext,
 onMarkWeak,
 onMarkKnown,
 onEdit,
 onGenerateExercises,
}: {
 point: GrammarPointWithProgress;
 lesson: GrammarLessonWithStats | null;
 index: number;
 total: number;
 activeTab: CoachTab;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 isGeneratingExercises: boolean;
 onTabChange: (value: CoachTab) => void;
 onSelectChoice: (value: string) => void;
 onCheckPractice: () => void;
 onPrev: () => void;
 onNext: () => void;
 onMarkWeak: () => void;
 onMarkKnown: () => void;
 onEdit: () => void;
 onGenerateExercises: () => void;
}) {
 const quiz = getCoachQuiz(point);
 const examples = point.content.examples || [];
 const formulaItems = point.content.formulas?.length
  ? point.content.formulas
  : point.content.structures || [];
 const traps = point.content.traps?.length
  ? point.content.traps
  : point.content.common_mistakes || [];
 const contrasts = point.content.coach_contrasts?.length
  ? point.content.coach_contrasts
  : (point.content.comparisons || []).map((body, contrastIndex) => ({
     title: `So sánh ${contrastIndex + 1}`,
     body,
    }));

 return (
  <article className="flex w-full max-w-full min-w-0 flex-col gap-5 overflow-x-hidden rounded-[20px] border border-stone-200 bg-white p-4 shadow-theme-sm md:p-6">
   <header className="flex w-full max-w-full flex-wrap items-start justify-between gap-4">
    <div className="flex min-w-0 max-w-full flex-col gap-3">
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">
      {lesson ? `Bài ${lesson.lesson_number}` : "Grammar card"} · {index + 1}/
      {total}
     </p>
     <h2 className="max-w-full break-words text-[clamp(2.2rem,12vw,4.4rem)] font-black leading-[0.98] text-stone-900 [overflow-wrap:anywhere]">
      {point.title}
     </h2>
     <p className="max-w-4xl break-words text-base font-bold leading-7 text-stone-600 [overflow-wrap:anywhere] md:text-lg">
      {getCoachCore(point)}
     </p>
     <div className="flex max-w-full flex-wrap gap-2">
      {point.tags.slice(0, 6).map((tag) => (
       <span
        key={tag}
        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
       >
        {tag}
       </span>
      ))}
      <StatusPill status={point.status} />
     </div>
    </div>
   </header>

   <SectionNav value={activeTab} onChange={onTabChange} />

   <div className="flex flex-col gap-5">
    <LearningSection
     id="grammar-logic"
     eyebrow="Logic cốt lõi"
     icon={FileText}
    >
     <p className="max-w-4xl break-words text-base font-bold leading-8 text-stone-700 [overflow-wrap:anywhere]">
      {point.content.explanation ||
       point.content.core ||
       "Chưa có giải thích."}
     </p>
     {!!point.content.usage_notes?.length && (
      <div className="grid w-full max-w-full min-w-0 gap-2 md:grid-cols-2">
       {point.content.usage_notes.map((item) => (
        <p
         key={item}
         className="min-w-0 break-words rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-800 [overflow-wrap:anywhere]"
        >
         {item}
        </p>
       ))}
      </div>
     )}
    </LearningSection>

    <LearningSection id="grammar-formula" eyebrow="Công thức" icon={Layers3}>
     <div className="grid w-full max-w-full min-w-0 gap-2 md:grid-cols-2">
      {formulaItems.length ? (
       formulaItems.map((item) => (
        <p
         key={item}
         className="min-w-0 whitespace-normal break-words rounded-2xl bg-stone-50 px-4 py-3 text-base font-black leading-7 text-stone-800 [overflow-wrap:anywhere]"
        >
         {item}
        </p>
       ))
      ) : (
       <p className="text-sm font-bold text-stone-500">Chưa có công thức.</p>
      )}
     </div>
    </LearningSection>

    <LearningSection id="grammar-examples" eyebrow="Ví dụ nhanh" icon={BookOpen}>
     {point.content.quick_example?.zh ? (
      <div className="w-full max-w-full min-w-0 overflow-x-hidden rounded-[18px] border border-red-100 bg-red-50/50 p-4">
       <p className="break-words text-2xl font-black text-stone-900 [overflow-wrap:anywhere]">
        {point.content.quick_example.zh}
       </p>
       {point.content.quick_example.pinyin ? (
        <p className="break-words pt-2 text-sm font-bold italic text-stone-500 [overflow-wrap:anywhere]">
         {point.content.quick_example.pinyin}
        </p>
       ) : null}
       {point.content.quick_example.vi ? (
        <p className="break-words pt-1 text-base font-bold text-stone-700 [overflow-wrap:anywhere]">
         {point.content.quick_example.vi}
        </p>
       ) : null}
      </div>
     ) : null}
     <div className="grid w-full max-w-full min-w-0 gap-3 xl:grid-cols-2">
      {examples.length ? (
       examples.map((example, exampleIndex) => (
        <div
         key={`${example.zh}-${exampleIndex}`}
         className="flex min-w-0 max-w-full flex-col gap-2 overflow-x-hidden rounded-[18px] border border-stone-200 bg-white p-4"
        >
         <p className="break-words text-xl font-black text-stone-900 [overflow-wrap:anywhere]">{example.zh}</p>
         {example.pinyin ? (
          <p className="break-words text-sm font-bold italic text-stone-500 [overflow-wrap:anywhere]">
           {example.pinyin}
          </p>
         ) : null}
         {example.vi ? (
          <p className="break-words text-base font-bold text-stone-700 [overflow-wrap:anywhere]">{example.vi}</p>
         ) : null}
         {example.note ? (
          <p className="break-words rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700 [overflow-wrap:anywhere]">
           {example.note}
          </p>
         ) : null}
        </div>
       ))
      ) : (
       <p className="font-bold text-stone-500">Chưa có ví dụ.</p>
      )}
     </div>
    </LearningSection>

    <LearningSection id="grammar-traps" eyebrow="Bẫy sai" icon={XCircle}>
     <div className="grid w-full max-w-full min-w-0 gap-2 md:grid-cols-2">
      {traps.length ? (
       traps.map((item) => (
        <p
         key={item}
         className="min-w-0 break-words rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold leading-6 text-stone-700 [overflow-wrap:anywhere]"
        >
         {item}
        </p>
       ))
      ) : (
       <p className="font-bold text-stone-500">Chưa có bẫy sai.</p>
      )}
     </div>
    </LearningSection>

    <LearningSection
     id="grammar-compare"
     eyebrow="So sánh dễ nhầm"
     icon={Layers3}
    >
     <div className="grid w-full max-w-full min-w-0 gap-3">
      {contrasts.length ? (
       contrasts.map((contrast) => (
        <div key={contrast.title} className="min-w-0 overflow-x-hidden rounded-[18px] bg-stone-50 p-4">
         <p className="break-words text-base font-black text-stone-900 [overflow-wrap:anywhere]">
          {contrast.title}
         </p>
         <p className="break-words pt-2 text-sm font-bold leading-7 text-stone-600 [overflow-wrap:anywhere]">
          {contrast.body}
         </p>
        </div>
       ))
      ) : (
       <p className="font-bold text-stone-500">Chưa có nội dung so sánh.</p>
      )}
     </div>
    </LearningSection>

    <LearningSection
     id="grammar-practice"
     eyebrow="Mini practice"
     icon={CheckCircle2}
    >
     <PracticeBlock
      point={point}
      quiz={quiz}
      selectedChoice={selectedChoice}
      checked={checked}
      correct={correct}
      isGeneratingExercises={isGeneratingExercises}
      onSelectChoice={onSelectChoice}
      onCheckPractice={onCheckPractice}
      onNext={onNext}
      onGenerateExercises={onGenerateExercises}
     />
    </LearningSection>
   </div>

   <div className="flex w-full max-w-full flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
    <div className="flex flex-wrap gap-2">
     <ActionButton onClick={onPrev} tone="neutral">
      ← Trước
     </ActionButton>
     <ActionButton onClick={onNext} tone="neutral">
      Tiếp →
     </ActionButton>
    </div>
    <div className="flex flex-wrap gap-2">
     <ActionButton onClick={onMarkWeak} icon={XCircle} tone="neutral">
      Còn yếu
     </ActionButton>
     <ActionButton onClick={onMarkKnown} icon={CheckCircle2}>
      Nắm rồi
     </ActionButton>
     <ActionButton onClick={onEdit} icon={FileText} tone="neutral">
      Sửa
     </ActionButton>
    </div>
   </div>
  </article>
 );
}

function SectionNav({
 value,
 onChange,
}: {
 value: CoachTab;
 onChange: (value: CoachTab) => void;
}) {
 const items: { key: CoachTab | "compare"; label: string; icon: LucideIcon; id: string }[] = [
  { key: "logic", label: "Logic", icon: FileText, id: "grammar-logic" },
  { key: "formula", label: "Công thức", icon: Layers3, id: "grammar-formula" },
  { key: "examples", label: "Ví dụ", icon: BookOpen, id: "grammar-examples" },
  { key: "traps", label: "Bẫy sai", icon: XCircle, id: "grammar-traps" },
  { key: "compare", label: "So sánh", icon: Layers3, id: "grammar-compare" },
  { key: "practice", label: "Practice", icon: CheckCircle2, id: "grammar-practice" },
 ];
 return (
  <nav className="no-scrollbar sticky top-20 z-10 flex w-full max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-stone-200 bg-white/95 pb-2 pt-1 backdrop-blur">
   {items.map((item) => {
    const Icon = item.icon;
    const active = value === item.key;
    return (
     <button
      key={item.key}
      type="button"
      onClick={() => {
       if (item.key !== "compare") onChange(item.key);
       document.getElementById(item.id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
       });
      }}
      className={cn(
       "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-black transition",
       active
        ? "bg-red-500 text-white shadow-theme-sm"
        : "text-stone-600 hover:bg-stone-100",
      )}
     >
      <Icon className="h-4 w-4" />
      {item.label}
     </button>
    );
   })}
  </nav>
 );
}

function LearningSection({
 id,
 eyebrow,
 icon: Icon,
 children,
}: {
 id: string;
 eyebrow: string;
 icon: LucideIcon;
 children: ReactNode;
}) {
 return (
  <section id={id} className="w-full max-w-full min-w-0 scroll-mt-28 overflow-x-hidden rounded-[18px] bg-white">
   <div className="flex items-center gap-2 pb-3">
    <Icon className="h-4 w-4 text-red-500" />
    <p className="text-sm font-black uppercase tracking-wide text-stone-500">
     {eyebrow}
    </p>
   </div>
   <div className="flex w-full max-w-full min-w-0 flex-col gap-3 overflow-x-hidden">{children}</div>
  </section>
 );
}

function PracticeBlock({
 point,
 quiz,
 selectedChoice,
 checked,
 correct,
 isGeneratingExercises,
 onSelectChoice,
 onCheckPractice,
 onNext,
 onGenerateExercises,
}: {
 point: GrammarPointWithProgress;
 quiz: ReturnType<typeof getCoachQuiz>;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 isGeneratingExercises: boolean;
 onSelectChoice: (value: string) => void;
 onCheckPractice: () => void;
 onNext: () => void;
 onGenerateExercises: () => void;
}) {
 if (!quiz) {
  return (
   <EmptyState
    title="Chưa có practice"
    description="Bấm tạo bài tập hoặc import JSON mẫu để có quiz."
    compact
   />
  );
 }

 return (
  <div className="grid w-full max-w-full min-w-0 gap-4 overflow-x-hidden">
   <p className="break-words text-xl font-black leading-8 text-stone-900 [overflow-wrap:anywhere]">{quiz.prompt}</p>
   <div className="grid w-full max-w-full min-w-0 gap-2">
    {quiz.choices.map((choice, choiceIndex) => {
     const isSelected = selectedChoice === String(choiceIndex);
     const isCorrect = checked && choiceIndex === quiz.answerIndex;
     const isWrong = checked && isSelected && !isCorrect;
     return (
      <button
       key={`${choice}-${choiceIndex}`}
       type="button"
       onClick={() => !checked && onSelectChoice(String(choiceIndex))}
       className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-2xl border bg-white p-3 text-left text-sm font-black transition",
        isCorrect
         ? "border-emerald-400 bg-emerald-50 text-emerald-700"
         : isWrong
           ? "border-red-400 bg-red-50 text-red-600"
           : isSelected
             ? "border-red-500 bg-red-50 text-red-600"
             : "border-stone-200 text-stone-800 hover:bg-stone-50",
       )}
      >
       <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs">
        {String.fromCharCode(65 + choiceIndex)}
       </span>
       <span className="min-w-0 break-words [overflow-wrap:anywhere]">{choice}</span>
      </button>
     );
    })}
   </div>
   {checked && (
    <div
     className={cn(
      "break-words rounded-2xl border p-3 text-sm font-black [overflow-wrap:anywhere]",
      correct
       ? "border-emerald-300 bg-emerald-50 text-emerald-700"
       : "border-red-300 bg-red-50 text-red-700",
     )}
    >
     {correct
      ? "Đúng rồi."
      : `Sai. Đáp án đúng: ${quiz.choices[quiz.answerIndex] || ""}`}
     {point.content.explanation ? (
      <p className="pt-2 font-bold leading-6">{point.content.explanation}</p>
     ) : null}
    </div>
   )}
   <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:gap-3">
    <ActionButton
     onClick={onCheckPractice}
     icon={Check}
     disabled={!selectedChoice || checked}
     tone="red"
    >
     Kiểm tra
    </ActionButton>
    <ActionButton onClick={onNext} icon={CheckCircle2} tone="neutral">
     Câu tiếp
    </ActionButton>
    <ActionButton
     onClick={onGenerateExercises}
     icon={CheckCircle2}
     loading={isGeneratingExercises}
     tone="neutral"
    >
     Tạo practice
    </ActionButton>
   </div>
  </div>
 );
}
