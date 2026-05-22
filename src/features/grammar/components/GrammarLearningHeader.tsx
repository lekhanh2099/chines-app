"use client";

import Link from "next/link";
import {
 BookOpen,
 Edit3,
 Layers3,
 Loader2,
 MoreHorizontal,
 Plus,
 Upload,
 type LucideIcon,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LearningModuleSwitch } from "@/features/learning/components";
import {
 getLessonWorkspaceContext,
 type LearningSource,
} from "@/features/learning/lesson-workspace";
import { cn } from "@/lib/utils";
import type { GrammarLessonWithStats } from "@/types/database";

export type GrammarMainTab = "study" | "all" | "edit";
export type GrammarSource = LearningSource;

export function LearningShell({ children }: { children: React.ReactNode }) {
 return (
  <div className="page-shell min-h-screen bg-stone-50">
   <div className="flex w-full max-w-full min-w-0 flex-col gap-3 px-3 py-3 sm:gap-5 sm:px-5 sm:py-5 lg:px-8">
    {children}
   </div>
  </div>
 );
}

export function LearningHeader({
 source,
 onSourceChange,
 activeTab,
 onTabChange,
 onCreateLesson,
 onCreatePoint,
 onImportHanyu,
 onImportCoachJson,
 isImportingHanyu,
 isImportingCoachJson,
 lessons,
 workspace,
}: {
 source: GrammarSource;
 onSourceChange: (source: GrammarSource) => void;
 activeTab: GrammarMainTab;
 onTabChange: (tab: GrammarMainTab) => void;
 onCreateLesson: () => void;
 onCreatePoint: () => void;
 onImportHanyu: () => void;
 onImportCoachJson: () => void;
 isImportingHanyu: boolean;
 isImportingCoachJson: boolean;
 lessons: GrammarLessonWithStats[];
 workspace: ReturnType<typeof getLessonWorkspaceContext>;
}) {
 const pointCount = lessons.reduce(
  (sum, lesson) => sum + lesson.points.length,
  0,
 );
 return (
  <header className="sticky top-0 z-20 w-full max-w-full overflow-x-hidden border-b border-stone-200 bg-stone-50/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-stone-50/85">
   <div className="flex min-h-16 w-full max-w-full min-w-0 flex-wrap items-center gap-2">
    <Link
     href="/"
     className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     ←
    </Link>
    <div className="min-w-0 flex-1">
     <p className="truncate text-sm font-black text-stone-900">
      {workspace.lessonTitle}
     </p>
     <p className="truncate text-xs font-bold text-stone-500">
      {workspace.summary.pointCount}/
      {pointCount || workspace.summary.pointCount} điểm
     </p>
    </div>
    <GrammarCompactSourceSwitch
     value={source}
     onChange={onSourceChange}
     className="order-3 w-full sm:order-none sm:w-auto"
    />
    <LearningModuleSwitch
     activeModule="grammar"
     vocabularyHref={workspace.vocabularyHref}
     grammarHref={workspace.grammarHref}
     className="hidden sm:flex"
    />
    <details className="relative shrink-0">
     <summary className="inline-flex h-10 cursor-pointer list-none items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      <MoreHorizontal className="h-5 w-5" />
     </summary>
     <div className="more-menu fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom)+12px)] z-30 max-h-[70dvh] overflow-y-auto rounded-[20px] border-2 border-stone-200 bg-white p-2 shadow-theme-md sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-[min(92vw,380px)]">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1 sm:hidden">
       <Link
        href={workspace.vocabularyHref}
        className="rounded-xl px-3 py-2 text-center text-sm font-black text-stone-600 hover:bg-white"
       >
        Từ vựng
       </Link>
       <Link
        href={workspace.grammarHref}
        className="rounded-xl bg-red-500 px-3 py-2 text-center text-sm font-black text-white"
       >
        Ngữ pháp
       </Link>
      </div>
      <div className="mt-2">
       <SegmentedControl
        value={activeTab}
        items={[
         { key: "study", label: "Học", icon: BookOpen },
         { key: "all", label: "Tất cả", icon: Layers3 },
         { key: "edit", label: "Sửa", icon: Edit3 },
        ]}
        onChange={(key) => onTabChange(key as GrammarMainTab)}
       />
      </div>
      <div className="mt-2 grid gap-2">
       <MenuButton
        onClick={onImportCoachJson}
        loading={isImportingCoachJson}
        icon={Upload}
       >
        Import JSON mẫu
       </MenuButton>
       <MenuButton
        onClick={onImportHanyu}
        loading={isImportingHanyu}
        icon={Upload}
       >
        Import Np.md
       </MenuButton>
       <MenuButton onClick={onCreatePoint} icon={Plus}>
        Thêm ngữ pháp
       </MenuButton>
       <MenuButton onClick={onCreateLesson} icon={Plus}>
        Thêm bài
       </MenuButton>
      </div>
     </div>
    </details>
   </div>
  </header>
 );
}

export function GrammarCompactSourceSwitch({
 value,
 onChange,
 className,
}: {
 value: GrammarSource;
 onChange: (value: GrammarSource) => void;
 className?: string;
}) {
 return (
  <div
   className={cn(
    "grid min-w-0 grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1",
    className,
   )}
  >
   {[
    { key: "hanyu" as const, label: "Hán ngữ" },
    { key: "hsk" as const, label: "HSK" },
   ].map((item) => (
    <button
     key={item.key}
     type="button"
     onClick={() => onChange(item.key)}
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

export function HskGrammarStudyBar({
 source,
 onSourceChange,
}: {
 source: GrammarSource;
 onSourceChange: (value: GrammarSource) => void;
}) {
 return (
  <header className="sticky top-0 z-20 flex min-h-16 w-full max-w-full min-w-0 flex-wrap items-center gap-2 overflow-x-hidden border-b border-stone-200 bg-stone-50/95 px-2 py-2 backdrop-blur">
   <Link
    href="/"
    className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
   >
    ←
   </Link>
   <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-black text-stone-900">Ngữ pháp HSK</p>
    <p className="truncate text-xs font-bold text-stone-500">
     Source HSK · luyện tập theo bài
    </p>
   </div>
   <GrammarCompactSourceSwitch value={source} onChange={onSourceChange} />
  </header>
 );
}

function MenuButton({
 children,
 icon: Icon,
 loading,
 onClick,
}: {
 children: React.ReactNode;
 icon: LucideIcon;
 loading?: boolean;
 onClick: () => void;
}) {
 return (
  <button
   type="button"
   onClick={onClick}
   disabled={loading}
   className="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-left text-sm font-black text-stone-700 hover:bg-stone-50 disabled:opacity-60"
  >
   {loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
   ) : (
    <Icon className="h-4 w-4" />
   )}
   {children}
  </button>
 );
}
