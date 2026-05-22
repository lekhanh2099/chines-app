"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, EyeOff, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
 ResizableHandle,
 ResizablePanel,
 ResizablePanelGroup,
} from "@/components/ui/resizable";
import { GrammarCoachCard, type CoachTab } from "./GrammarCoachCard";
import {
 ActionButton,
 EmptyState,
 Field,
} from "@/features/grammar/components/ui";
import { getPointSubtitle } from "@/features/grammar/utils/point";
import { RelatedVocabularyCard } from "@/features/learning/components";
import { getLessonWorkspaceContext } from "@/features/learning/lesson-workspace";
import { VocabularyMiniList } from "@/features/vocabulary";
import { cn } from "@/lib/utils";
import type {
 GrammarLessonWithStats,
 GrammarPointWithProgress,
 VocabEntryWithProgress,
} from "@/types/database";

export type CoachStatusFilter = "all" | "new" | "ok" | "weak";
export type CoachOrder = "lesson" | "hard" | "random";

export function GrammarCoachWorkspace(props: {
 lessons: GrammarLessonWithStats[];
 points: GrammarPointWithProgress[];
 point: GrammarPointWithProgress | null;
 activeIndex: number;
 stats: {
  range: string;
  filtered: number;
  mastered: number;
  weak: number;
  practice: number;
 };
 lessonById: Map<string, GrammarLessonWithStats>;
 tags: string[];
 fromLesson: number;
 toLesson: number;
 status: CoachStatusFilter;
 order: CoachOrder;
 tag: string;
 searchQuery: string;
 activeTab: CoachTab;
 vocabulary: VocabEntryWithProgress[];
 workspace: ReturnType<typeof getLessonWorkspaceContext>;
 selectedChoice: string | null;
 checked: boolean;
 correct: boolean | null;
 isGeneratingExercises: boolean;
 onFromLessonChange: (value: number) => void;
 onToLessonChange: (value: number) => void;
 onStatusChange: (value: CoachStatusFilter) => void;
 onOrderChange: (value: CoachOrder) => void;
 onTagChange: (value: string) => void;
 onSearchChange: (value: string) => void;
 onTabChange: (value: CoachTab) => void;
 onSelectPoint: (point: GrammarPointWithProgress) => void;
 onSelectChoice: (value: string) => void;
 onCheckPractice: () => void;
 onPrev: () => void;
 onNext: () => void;
 onMarkWeak: () => void;
 onMarkKnown: () => void;
 onEditPoint: (point: GrammarPointWithProgress) => void;
 onGenerateExercises: () => void;
}) {
 const {
  lessons,
  points,
  point,
  activeIndex,
  stats,
  lessonById,
  vocabulary,
  workspace,
 } = props;
 const [focusMode, setFocusMode] = useState(false);

 useEffect(() => {
  const stored = window.localStorage.getItem("grammar-focus-mode");
  if (stored) setFocusMode(stored === "true");
 }, []);

 const updateFocusMode = (next: boolean) => {
  setFocusMode(next);
  window.localStorage.setItem("grammar-focus-mode", String(next));
 };

 const centerPanel = !point ? (
  <EmptyState
   title="Không có ngữ pháp trong bộ lọc"
   description="Nới range bài hoặc bỏ tag/search để thấy lại danh sách."
   compact
  />
 ) : (
  <GrammarCoachCard
   point={point}
   lesson={point.lesson_id ? lessonById.get(point.lesson_id) || null : null}
   index={activeIndex}
   total={points.length}
   activeTab={props.activeTab}
   selectedChoice={props.selectedChoice}
   checked={props.checked}
   correct={props.correct}
   isGeneratingExercises={props.isGeneratingExercises}
   onTabChange={props.onTabChange}
   onSelectChoice={props.onSelectChoice}
   onCheckPractice={props.onCheckPractice}
   onPrev={props.onPrev}
   onNext={props.onNext}
   onMarkWeak={props.onMarkWeak}
   onMarkKnown={props.onMarkKnown}
   onEdit={() => props.onEditPoint(point)}
   onGenerateExercises={props.onGenerateExercises}
  />
 );

 const leftPanel = (
  <GrammarPointNav
   lessons={lessons}
   points={points}
   point={point}
   tags={props.tags}
   fromLesson={props.fromLesson}
   toLesson={props.toLesson}
   status={props.status}
   order={props.order}
   tag={props.tag}
   searchQuery={props.searchQuery}
   onFromLessonChange={props.onFromLessonChange}
   onToLessonChange={props.onToLessonChange}
   onStatusChange={props.onStatusChange}
   onOrderChange={props.onOrderChange}
   onTagChange={props.onTagChange}
   onSearchChange={props.onSearchChange}
   onSelectPoint={props.onSelectPoint}
  />
 );

 const rightPanel = (
  <RightRail
   stats={stats}
   points={points}
   vocabulary={vocabulary}
   workspace={workspace}
   isGeneratingExercises={props.isGeneratingExercises}
   onPractice={() => props.onTabChange("practice")}
   onGenerateExercises={props.onGenerateExercises}
  />
 );

 return (
  <>
  <div className="w-full max-w-full min-w-0 overflow-x-hidden px-3 pt-3 lg:hidden">
    <Select
     value={point?.id || ""}
     onChange={(event) => {
      const nextPoint = points.find((item) => item.id === event.target.value);
      if (nextPoint) props.onSelectPoint(nextPoint);
     }}
     className="h-11 rounded-2xl border-2 border-stone-200 bg-white text-sm font-black shadow-theme-sm"
    >
     {points.map((item, index) => (
      <option key={item.id} value={item.id}>
       {index + 1}. {item.title}
      </option>
     ))}
    </Select>
   </div>

   <div className="flex w-full max-w-full justify-end overflow-x-hidden px-3 py-2">
    <button
     type="button"
     onClick={() => updateFocusMode(!focusMode)}
     className="inline-flex h-9 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-600 shadow-theme-sm hover:bg-stone-50"
    >
     <EyeOff className="h-4 w-4" />
     {focusMode ? "Thoát focus" : "Focus mode"}
    </button>
   </div>

   <div className="hidden w-full max-w-full min-w-0 overflow-x-hidden px-2 lg:block">
    {focusMode ? (
     <main className="mx-auto w-full max-w-5xl min-w-0 overflow-x-hidden">{centerPanel}</main>
    ) : (
     <ResizablePanelGroup
      orientation="horizontal"
      autoSave="grammar-study-panels"
      className="min-h-[calc(100vh-128px)] w-full max-w-full min-w-0 gap-3 overflow-hidden"
     >
      <ResizablePanel id="grammar-left" defaultSize={22} minSize={16} maxSize={28}>
       <aside className="h-full min-w-0 overflow-y-auto overflow-x-hidden pr-1">{leftPanel}</aside>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="grammar-center" defaultSize={52} minSize={42}>
       <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden px-1">{centerPanel}</main>
      </ResizablePanel>
      <ResizableHandle className="hidden xl:flex" />
      <ResizablePanel
       id="grammar-right"
       defaultSize={26}
       minSize={18}
       maxSize={34}
       className="hidden xl:block"
      >
       <aside className="h-full min-w-0 overflow-y-auto overflow-x-hidden pl-1">{rightPanel}</aside>
      </ResizablePanel>
     </ResizablePanelGroup>
    )}
   </div>

   <div className="grid w-full max-w-full min-w-0 gap-3 overflow-x-hidden px-3 py-3 lg:hidden">
    {centerPanel}
    {rightPanel}
   </div>
  </>
 );
}

function GrammarPointNav({
 lessons,
 points,
 point,
 tags,
 fromLesson,
 toLesson,
 status,
 order,
 tag,
 searchQuery,
 onFromLessonChange,
 onToLessonChange,
 onStatusChange,
 onOrderChange,
 onTagChange,
 onSearchChange,
 onSelectPoint,
}: {
 lessons: GrammarLessonWithStats[];
 points: GrammarPointWithProgress[];
 point: GrammarPointWithProgress | null;
 tags: string[];
 fromLesson: number;
 toLesson: number;
 status: CoachStatusFilter;
 order: CoachOrder;
 tag: string;
 searchQuery: string;
 onFromLessonChange: (value: number) => void;
 onToLessonChange: (value: number) => void;
 onStatusChange: (value: CoachStatusFilter) => void;
 onOrderChange: (value: CoachOrder) => void;
 onTagChange: (value: string) => void;
 onSearchChange: (value: string) => void;
 onSelectPoint: (point: GrammarPointWithProgress) => void;
}) {
 const lessonNumbers = lessons
  .map((lesson) => lesson.lesson_number)
  .filter((value): value is number => typeof value === "number")
  .sort((a, b) => a - b);

 return (
  <section className="flex h-full w-full max-w-full min-w-0 flex-col gap-3 overflow-x-hidden rounded-[20px] border border-stone-200 bg-white p-3 shadow-theme-sm">
   <div className="flex items-center justify-between gap-3">
    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
     Điểm ngữ pháp
    </p>
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
     {points.length}
    </span>
   </div>
   <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
    <Input
     value={searchQuery}
     onChange={(event) => onSearchChange(event.target.value)}
     placeholder="Tìm..."
     className="h-10 rounded-2xl pl-10 text-sm"
    />
   </div>
   <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
    {points.map((item, index) => (
     <button
      key={item.id}
      type="button"
      onClick={() => onSelectPoint(item)}
      className={cn(
       "w-full rounded-2xl px-3 py-2 text-left transition",
       item.id === point?.id
        ? "bg-red-50 text-red-600"
        : "text-stone-700 hover:bg-stone-50",
      )}
     >
      <p className="truncate text-sm font-black">
       {index + 1}. {item.title}
      </p>
      {item.id === point?.id && (
       <p className="truncate text-xs font-bold opacity-70">
        {getPointSubtitle(item)}
       </p>
      )}
     </button>
    ))}
   </div>
   <details className="w-full max-w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 p-3">
    <summary className="cursor-pointer list-none text-sm font-black text-stone-700">
     Bộ lọc
    </summary>
    <div className="grid gap-3 pt-3">
     <div className="grid grid-cols-2 gap-2">
      <Field label="Từ bài">
       <Select
        value={String(fromLesson)}
        onChange={(event) => onFromLessonChange(Number(event.target.value))}
       >
        {lessonNumbers.map((lessonNumber) => (
         <option key={lessonNumber} value={lessonNumber}>
          Bài {lessonNumber}
         </option>
        ))}
       </Select>
      </Field>
      <Field label="Đến bài">
       <Select
        value={String(toLesson)}
        onChange={(event) => onToLessonChange(Number(event.target.value))}
       >
        {lessonNumbers.map((lessonNumber) => (
         <option key={lessonNumber} value={lessonNumber}>
          Bài {lessonNumber}
         </option>
        ))}
       </Select>
      </Field>
     </div>
     <Field label="Trạng thái">
      <Select
       value={status}
       onChange={(event) =>
        onStatusChange(event.target.value as CoachStatusFilter)
       }
      >
       <option value="all">Tất cả</option>
       <option value="new">Chưa học</option>
       <option value="weak">Còn yếu</option>
       <option value="ok">Đã nắm</option>
      </Select>
     </Field>
     <Field label="Thứ tự">
      <Select
       value={order}
       onChange={(event) => onOrderChange(event.target.value as CoachOrder)}
      >
       <option value="lesson">Theo bài</option>
       <option value="hard">Ưu tiên yếu</option>
       <option value="random">Random ổn định</option>
      </Select>
     </Field>
     <Field label="Tag">
      <Select value={tag} onChange={(event) => onTagChange(event.target.value)}>
       <option value="all">Tất cả tag</option>
       {tags.map((item) => (
        <option key={item} value={item}>
         {item}
        </option>
       ))}
      </Select>
     </Field>
    </div>
   </details>
  </section>
 );
}

function RightRail({
 stats,
 points,
 vocabulary,
 workspace,
 isGeneratingExercises,
 onPractice,
 onGenerateExercises,
}: {
 stats: {
  filtered: number;
  weak: number;
  practice: number;
 };
 points: GrammarPointWithProgress[];
 vocabulary: VocabEntryWithProgress[];
 workspace: ReturnType<typeof getLessonWorkspaceContext>;
 isGeneratingExercises: boolean;
 onPractice: () => void;
 onGenerateExercises: () => void;
}) {
 const contrasts = points
  .flatMap((item) => item.content.coach_contrasts || [])
  .filter(
   (item, index, arr) =>
    arr.findIndex((candidate) => candidate.title === item.title) === index,
  );
 return (
  <div className="grid w-full max-w-full min-w-0 gap-3 overflow-x-hidden">
   <RelatedVocabularyCard workspace={workspace} />
   <section className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-theme-sm">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
     Practice
    </p>
    <p className="pt-2 text-sm font-bold leading-6 text-stone-500">
     {stats.filtered} điểm trong bộ lọc · {stats.weak} còn yếu ·{" "}
     {stats.practice} câu đúng phiên này.
    </p>
    <div className="grid gap-2 pt-3">
     <ActionButton onClick={onPractice} icon={CheckCircle2}>
      Làm bài tập
     </ActionButton>
     <ActionButton
      onClick={onGenerateExercises}
      icon={Sparkles}
      loading={isGeneratingExercises}
      tone="neutral"
     >
      Tạo practice
     </ActionButton>
    </div>
   </section>
   <section className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-theme-sm">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">
     So sánh dễ nhầm
    </p>
    <div className="grid gap-2 pt-3">
     {contrasts.length ? (
      contrasts.slice(0, 3).map((contrast) => (
       <a
        key={contrast.title}
        href="#grammar-compare"
        className="rounded-2xl bg-stone-50 p-3 hover:bg-stone-100"
       >
        <p className="text-sm font-black text-stone-900">{contrast.title}</p>
        <p className="line-clamp-2 pt-1 text-xs font-bold leading-5 text-stone-600">
         {contrast.body}
        </p>
       </a>
      ))
     ) : (
      <p className="text-sm font-bold text-stone-500">Chưa có panel so sánh.</p>
     )}
    </div>
   </section>
   <VocabularyMiniList entries={vocabulary} />
  </div>
 );
}
