"use client";

import type { ReactNode } from "react";
import {
 BookOpen,
 Brain,
 Edit3,
 Eye,
 FileText,
 HelpCircle,
 Keyboard,
 Layers3,
 RotateCcw,
 Upload,
 type LucideIcon,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
 LessonSelectCard,
 type LessonSelectOption,
} from "@/features/learning/components";
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
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3">
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
 onLessonChange: (lessonId: string) => void;
}) {
 const isFlashcardFocus = activeTab === "study" && mode === "flashcard";
 return (
  <header className="rounded-[22px] border-2 border-stone-200 bg-white p-3 shadow-theme-sm md:rounded-[24px]">
   <div
    className={cn(
     "grid gap-3 xl:items-start",
     isFlashcardFocus
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      : "xl:grid-cols-[minmax(0,1fr)_minmax(320px,42%)]",
    )}
   >
    <div className="min-w-0">
     <h1
      className={cn(
       "font-black tracking-normal text-stone-900",
       isFlashcardFocus
        ? "text-xl sm:text-2xl md:text-3xl"
        : "text-3xl md:text-4xl",
      )}
     >
      {title}
     </h1>
     <p
      className={cn(
       "mt-1 max-w-2xl text-sm font-bold leading-6 text-stone-500",
       isFlashcardFocus && "hidden md:block",
      )}
     >
      {description}
     </p>
     <div className="mt-2 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
      <SegmentedControl
       value={activeTab}
       items={[
        { key: "study", label: "Học", icon: BookOpen },
        { key: "all", label: "Từ", icon: Layers3 },
        { key: "edit", label: "Sửa", icon: Edit3 },
       ]}
       onChange={(key) => onTabChange(key as MainTab)}
      />
      <div className="hidden gap-2 md:flex">
       {allowDocxReset && (
        <ActionButton
         onClick={onResetImport}
         loading={resetting}
         icon={Upload}
         tone="neutral"
        >
         Reset docs
        </ActionButton>
       )}

       <ActionButton
        onClick={onRandomToggle}
        icon={RotateCcw}
        tone={randomMode ? "purple" : "neutral"}
       >
        {randomMode ? "Đang random" : "Ngẫu nhiên"}
       </ActionButton>
      </div>
     </div>
    </div>

    {activeTab === "study" && lessons.length > 0 ? (
     isFlashcardFocus ? (
      <CompactLessonSelect
       lessons={lessons}
       activeLessonId={activeLesson?.id || lessons[0]?.id || ""}
       onLessonChange={onLessonChange}
      />
     ) : (
      <LessonSelectPanel
       lessons={lessons}
       activeLessonId={activeLesson?.id || lessons[0]?.id || ""}
       onLessonChange={onLessonChange}
      />
     )
    ) : null}
   </div>

   {activeTab === "study" && (
    <div className="mt-3 flex max-w-full items-center gap-2 overflow-x-auto pb-1">
     <SegmentedControl
      value={mode}
      items={studyModes.map((item) => ({
       key: item.key,
       label: item.label,
       icon: item.icon,
      }))}
      onChange={(key) => onModeChange(key as StudyMode)}
     />
     <IconToolButton
      icon={HelpCircle}
      label="Shortcut"
      onClick={onShowShortcuts}
     />
    </div>
   )}
  </header>
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
 const activeLesson =
  lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0] || null;
 return (
  <div className="rounded-[18px] border-2 border-blue-200 bg-blue-50/60 p-3 shadow-theme-sm md:rounded-[20px]">
   <div className="flex items-center justify-between gap-2">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
     Bài đang học
    </p>
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600 shadow-theme-sm">
     {lessons.length} bài
    </span>
   </div>
   <Select
    value={activeLessonId}
    onChange={(event) => onLessonChange(event.target.value)}
    className="mt-2 h-10 text-xs sm:h-11 sm:text-sm"
   >
    {lessons.map((lesson) => (
     <option key={lesson.id} value={lesson.id}>
      {lesson.title.replace(/^Tổng quan & Phân nhóm từ vựng\s*/i, "")} · Đã học{" "}
      {lesson.studied}/{lesson.entries.length}
     </option>
    ))}
   </Select>
   {activeLesson && (
    <p className="mt-2 truncate text-xs font-bold text-stone-500">
     {activeLesson.categories
      .slice(0, 2)
      .map((item) => item.name)
      .join(", ") || "Bổ sung"}
    </p>
   )}
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
