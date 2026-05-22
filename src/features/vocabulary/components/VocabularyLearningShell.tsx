"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
 BookOpen,
 Brain,
 Edit3,
 Eye,
 FileText,
 HelpCircle,
 Keyboard,
 Layers3,
 MoreHorizontal,
 RotateCcw,
 Upload,
 type LucideIcon,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
 LearningModuleSwitch,
 LessonSelectCard,
 type LessonSelectOption,
} from "@/features/learning/components";
import { learningRoutes } from "@/features/learning/lesson-workspace";
import type { LearningSource } from "@/features/learning/lesson-workspace";
import {
 ActionButton,
 IconToolButton,
} from "@/features/vocabulary/components/VocabularyStudyPrimitives";
import type { MainTab, StudyMode } from "@/features/vocabulary/types";
import { cn } from "@/lib/utils";
import type { VocabLessonWithStats } from "@/types/database";

const studyModes: { key: StudyMode; label: string; icon: LucideIcon }[] = [
 { key: "list", label: "List", icon: Layers3 },
 { key: "guess", label: "Đoán từ", icon: Brain },
 { key: "flashcard", label: "Flashcard", icon: Eye },
 { key: "write", label: "Viết", icon: Keyboard },
 { key: "examples", label: "Ví dụ", icon: FileText },
 { key: "quiz", label: "Quiz", icon: FileText },
 { key: "reverse", label: "Ngược", icon: RotateCcw },
];

function LearningShell({ children }: { children: ReactNode }) {
 return (
  <div className="page-shell min-h-screen bg-stone-50">
   <div className="flex w-full max-w-full min-w-0 flex-col gap-3">
    {children}
   </div>
  </div>
 );
}

function LearningHeader({
 title,
 description,
 activeTab,
 onTabChange,
 mode,
 onModeChange,
 randomMode,
 onRandomToggle,
 onResetImport,
 resetting,
 allowDocxReset,
 onShowShortcuts,
 lessons,
 activeLesson,
 sourceMode,
 onSourceModeChange,
 onLessonChange,
}: {
 title: string;
 description: string;
 activeTab: MainTab;
 onTabChange: (tab: MainTab) => void;
 mode: StudyMode;
 onModeChange: (mode: StudyMode) => void;
 randomMode: boolean;
 onRandomToggle: () => void;
 onResetImport: () => void;
 resetting: boolean;
 allowDocxReset: boolean;
 onShowShortcuts: () => void;
 lessons: VocabLessonWithStats[];
 activeLesson: VocabLessonWithStats | null;
 sourceMode: LearningSource;
 onSourceModeChange?: (source: LearningSource) => void;
 onLessonChange: (lessonId: string) => void;
}) {
 const lessonNumber = activeLesson?.lesson_number ?? undefined;
 const lessonKey = activeLesson?.lesson_key ?? undefined;
 const grammarHref = learningRoutes.grammar({ source: sourceMode, lessonNumber, lessonKey });
 const vocabularyHref = learningRoutes.vocabulary({ source: sourceMode, lessonNumber, lessonKey, mode });
 return (
  <header className="sticky top-0 z-20 w-full max-w-full overflow-x-hidden border-b border-stone-200 bg-stone-50/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-stone-50/85">
   <div className="flex min-h-16 w-full max-w-full min-w-0 flex-wrap items-center gap-2">
    <Link href="/" className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
     ←
    </Link>
    <div className="min-w-0 flex-1">
     <p className="truncate text-sm font-black text-stone-900">
      {activeLesson?.title || title}
     </p>
     <p className="truncate text-xs font-bold text-stone-500">
      {activeLesson ? `${activeLesson.studied}/${activeLesson.entries.length} thẻ` : description}
     </p>
    </div>
    <SourceModeSwitch
     value={sourceMode}
     onChange={onSourceModeChange}
     className="order-3 w-full sm:order-none sm:w-auto"
    />
    {activeTab === "study" && lessons.length > 0 ? (
     <div className="order-3 w-full min-w-0 sm:order-none sm:w-[280px]">
      <CompactLessonSelect
       lessons={lessons}
       activeLessonId={activeLesson?.id || lessons[0]?.id || ""}
       onLessonChange={onLessonChange}
      />
     </div>
    ) : null}
    {sourceMode === "hanyu" ? (
     <LearningModuleSwitch
      activeModule="vocabulary"
      vocabularyHref={vocabularyHref}
      grammarHref={grammarHref}
      className="hidden sm:flex"
     />
    ) : (
     <span className="hidden rounded-2xl border-2 border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-500 shadow-theme-sm sm:inline-flex">
      HSK từ vựng
     </span>
    )}
    <details className="relative shrink-0">
     <summary className="inline-flex h-10 cursor-pointer list-none items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      <MoreHorizontal className="h-5 w-5" />
     </summary>
     <div className="more-menu fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom)+12px)] z-30 max-h-[70dvh] overflow-y-auto rounded-[20px] border-2 border-stone-200 bg-white p-2 shadow-theme-md sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-[min(92vw,360px)]">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1 sm:hidden">
       <Link href={vocabularyHref} className="rounded-xl bg-red-500 px-3 py-2 text-center text-sm font-black text-white">Từ vựng</Link>
       {sourceMode === "hanyu" ? (
        <Link href={grammarHref} className="rounded-xl px-3 py-2 text-center text-sm font-black text-stone-600 hover:bg-white">Ngữ pháp</Link>
       ) : (
        <span className="rounded-xl px-3 py-2 text-center text-sm font-black text-stone-400">Ngữ pháp</span>
       )}
      </div>
      <div className="mt-2">
       <SegmentedControl
        value={activeTab}
        items={[
         { key: "study", label: "Học", icon: BookOpen },
         { key: "all", label: "Từ", icon: Layers3 },
         { key: "edit", label: "Sửa", icon: Edit3 },
        ]}
        onChange={(key) => onTabChange(key as MainTab)}
       />
      </div>
      {activeTab === "study" && (
       <div className="mt-2">
        <SegmentedControl
         value={mode}
         items={studyModes.map((item) => ({
          key: item.key,
          label: item.label,
          icon: item.icon,
         }))}
         onChange={(key) => onModeChange(key as StudyMode)}
        />
       </div>
      )}
      <div className="mt-2 grid gap-2">
       {allowDocxReset && (
        <ActionButton onClick={onResetImport} loading={resetting} icon={Upload} tone="neutral">
         Reset docs
        </ActionButton>
       )}
       <ActionButton onClick={onRandomToggle} icon={RotateCcw} tone={randomMode ? "purple" : "neutral"}>
        {randomMode ? "Đang random" : "Ngẫu nhiên"}
       </ActionButton>
       <ActionButton onClick={onShowShortcuts} icon={HelpCircle} tone="neutral">
        Shortcut
       </ActionButton>
      </div>
     </div>
    </details>
   </div>
  </header>
 );
}

function SourceModeSwitch({
 value,
 onChange,
 className,
}: {
 value: LearningSource;
 onChange?: (value: LearningSource) => void;
 className?: string;
}) {
 const items: { key: LearningSource; label: string }[] = [
  { key: "hanyu", label: "Hán ngữ" },
  { key: "hsk", label: "HSK" },
 ];
 return (
  <div className={cn("grid min-w-0 grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1", className)}>
   {items.map((item) => (
    <button
     key={item.key}
     type="button"
     onClick={() => onChange?.(item.key)}
     className={cn(
      "h-10 min-w-0 truncate rounded-xl px-3 text-sm font-black transition",
      value === item.key
       ? "bg-red-500 text-white shadow-theme-sm"
       : "text-stone-600 hover:bg-white",
     )}
    >
     {item.label}
    </button>
   ))}
  </div>
 );
}

function LessonSelectPanel({
 lessons,
 activeLessonId,
 onLessonChange,
}: {
 lessons: VocabLessonWithStats[];
 activeLessonId: string;
 onLessonChange: (lessonId: string) => void;
}) {
 const activeLesson =
  lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null;
 const options: LessonSelectOption[] = lessons.map((lesson) => ({
  id: lesson.id,
  label: `${lesson.title.replace(/^Tổng quan & Phân nhóm từ vựng\s*/i, "")} · Đã học ${lesson.studied}/${lesson.entries.length}`,
  progressLabel: `Tiến độ ${lesson.progress}%`,
  countLabel: `Đã học ${lesson.studied}/${lesson.entries.length}`,
  categoryLabel:
   lesson.categories
    .slice(0, 2)
    .map((item) => item.name)
    .join(", ") || "Bổ sung",
 }));

 return (
  <LessonSelectCard
   countLabel={`${lessons.length} bài`}
   value={activeLessonId}
   options={options}
   onChange={onLessonChange}
   footer={activeLesson ? undefined : null}
  />
 );
}

function CompactLessonSelect({
 lessons,
 activeLessonId,
 onLessonChange,
}: {
 lessons: VocabLessonWithStats[];
 activeLessonId: string;
 onLessonChange: (lessonId: string) => void;
}) {
 return (
  <div className="min-w-0">
   <Select
    value={activeLessonId}
    onChange={(event) => onLessonChange(event.target.value)}
    wrapperClassName="min-w-0"
    className="h-10 rounded-2xl border-2 border-stone-200 bg-white text-xs font-black shadow-theme-sm sm:text-sm"
   >
    {lessons.map((lesson) => (
     <option key={lesson.id} value={lesson.id}>
      {lesson.title.replace(/^Tổng quan & Phân nhóm từ vựng\s*/i, "")} · Đã học{" "}
      {lesson.studied}/{lesson.entries.length}
     </option>
    ))}
   </Select>
  </div>
 );
}

function StatBox({
 value,
 label,
 tone,
}: {
 value: number;
 label: string;
 tone: "yellow" | "blue" | "green";
}) {
 const className = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return (
  <div
   className={cn(
    "min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm",
    className,
   )}
  >
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
  </div>
 );
}

export { LearningHeader, LearningShell, StatBox };
