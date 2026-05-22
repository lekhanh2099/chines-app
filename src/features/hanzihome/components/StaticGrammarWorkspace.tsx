"use client";

import { useMemo, useState } from "react";

import { Select } from "@/components/ui/select";
import {
 GrammarCoachCard,
 type CoachTab,
} from "@/features/grammar/components/GrammarCoachCard";
import { EmptyState } from "@/features/grammar/components/ui";
import { getHanziHomeGrammarCourse } from "@/features/hanzihome/static-data";
import type { HanziHomeGrammarLesson } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";

const GRAMMAR_PROGRESS_KEY = "hanzihome:grammar-known:v1";

export function StaticGrammarWorkspace({
 lessonNumber,
 lesson,
 onLessonNumberChange,
}: {
 lessonNumber: number;
 lesson: HanziHomeGrammarLesson | null;
 onLessonNumberChange: (value: number) => void;
}) {
 const grammarCourse = useMemo(() => getHanziHomeGrammarCourse(), []);
 const [pointId, setPointId] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<CoachTab>("logic");
 const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
 const [checked, setChecked] = useState(false);
 const [knownIds, setKnownIds] = useState<Set<string>>(() => {
  if (typeof window === "undefined") return new Set();
  const stored = window.localStorage.getItem(GRAMMAR_PROGRESS_KEY);
  if (!stored) return new Set();
  try {
   const ids = JSON.parse(stored) as string[];
   return new Set(ids);
  } catch {
   return new Set();
  }
 });
 const activeLesson =
  lesson ||
  grammarCourse.lessons.find((item) => item.lesson_number === lessonNumber) ||
  grammarCourse.lessons[0] ||
  null;
 const points = activeLesson?.points || [];
 const activePoint =
  points.find((point) => point.id === pointId) || points[0] || null;
 const activeIndex = activePoint
  ? Math.max(
     points.findIndex((point) => point.id === activePoint.id),
     0,
    )
  : 0;
 const pointWithProgress = activePoint
  ? {
     ...activePoint,
     proficiency_level: knownIds.has(activePoint.id) ? 5 : 0,
     status: knownIds.has(activePoint.id)
      ? ("mastered" as const)
      : ("new" as const),
    }
  : null;

 const resetPractice = () => {
  setSelectedChoice(null);
  setChecked(false);
 };

 const saveKnownIds = (updater: (current: Set<string>) => Set<string>) => {
  setKnownIds((current) => {
   const next = updater(current);
   if (typeof window !== "undefined") {
    window.localStorage.setItem(GRAMMAR_PROGRESS_KEY, JSON.stringify([...next]));
   }
   return next;
  });
 };

 const go = (delta: number) => {
  if (!points.length) return;
  const nextIndex = (activeIndex + delta + points.length) % points.length;
  setPointId(points[nextIndex]?.id || null);
  resetPractice();
 };

 if (!activeLesson || !pointWithProgress) {
  return (
   <EmptyState
    title="Bài này chưa có ngữ pháp"
    description="Đổi bài khác trong bộ HanziHome để học ngữ pháp."
    compact
   />
  );
 }

 return (
  <div className="hanzihome-learning-split-layout">
   <aside className="flex min-w-0 flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-theme-sm">
    <Select
     value={String(activeLesson.lesson_number || lessonNumber)}
     onChange={(event) => {
      onLessonNumberChange(Number(event.target.value));
      setPointId(null);
      resetPractice();
     }}
     className="h-11 rounded-2xl border-2 bg-white text-sm font-black"
    >
     {grammarCourse.lessons.map((item) => (
      <option key={item.id} value={item.lesson_number || 0}>
       {item.title}
      </option>
     ))}
    </Select>
    <div className="no-scrollbar flex max-h-[52dvh] flex-col gap-1 overflow-y-auto">
     {points.map((point, index) => (
      <button
       key={point.id}
       type="button"
       onClick={() => {
        setPointId(point.id);
        resetPractice();
       }}
       className={cn(
        "min-w-0 rounded-2xl px-3 py-2 text-left text-sm font-black transition",
        point.id === pointWithProgress.id
         ? "bg-red-50 text-red-600"
         : "text-stone-700 hover:bg-stone-50",
       )}
      >
       <span className="text-xs text-stone-400">{index + 1}.</span>{" "}
       <span className="break-words [overflow-wrap:anywhere]">
        {point.title}
       </span>
      </button>
     ))}
    </div>
   </aside>
   <GrammarCoachCard
    point={pointWithProgress}
    lesson={activeLesson}
    index={activeIndex}
    total={points.length}
    activeTab={activeTab}
    selectedChoice={selectedChoice}
    checked={checked}
    correct={checked ? selectedChoice === "0" : null}
    isGeneratingExercises={false}
    onTabChange={setActiveTab}
    onSelectChoice={setSelectedChoice}
    onCheckPractice={() => setChecked(true)}
    onPrev={() => go(-1)}
    onNext={() => go(1)}
    onMarkWeak={() =>
     saveKnownIds(
      (current) =>
       new Set([...current].filter((id) => id !== pointWithProgress.id)),
     )
    }
    onMarkKnown={() =>
     saveKnownIds((current) => new Set(current).add(pointWithProgress.id))
    }
    onEdit={() => undefined}
    onGenerateExercises={() => undefined}
   />
  </div>
 );
}
