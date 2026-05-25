"use client";

import { type DragEvent, type ReactNode, useMemo, useState } from "react";
import {
 BookOpen,
 FileText,
 GraduationCap,
 GripVertical,
 Home,
 RotateCcw,
 type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SegmentedControlItem } from "@/components/ui/segmented-control";
import { Tabs } from "@/components/ui/tabs";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import type {
 HanziHomeLesson,
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type StudyModule = Exclude<HanziHomeModule, "radicals">;
type PaneId = "left" | "right";

type PaneLayout = {
 left: StudyModule[];
 right: StudyModule[];
 activeLeft: StudyModule;
 activeRight: StudyModule;
};

type ModuleMeta = {
 key: StudyModule;
 label: string;
 icon: LucideIcon;
};

type ModuleSplitWorkspaceProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 activeModule: StudyModule;
 singleContent: ReactNode;
 onSelectModule: (module: StudyModule) => void;
 onBookmarkVocab: (id: string) => void;
 onMarkVocab: (id: string, status: LearningStatus) => void;
 onBookmarkGrammar: (id: string) => void;
 onMarkGrammar: (id: string, status: LearningStatus) => void;
 onAnswerReview: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
};

const splitEnabledKey = "hanzihome:module-split-enabled:v1";
const paneLayoutKey = "hanzihome:module-pane-layout:v1";

const studyModules = [
 "overview",
 "lessonText",
 "vocab",
 "grammar",
 "review",
] as const satisfies readonly StudyModule[];

const defaultPaneLayout: PaneLayout = {
 left: ["overview", "lessonText"],
 right: ["vocab", "grammar", "review"],
 activeLeft: "overview",
 activeRight: "vocab",
};

const moduleMeta = {
 overview: { key: "overview", label: "Tổng quan", icon: Home },
 lessonText: { key: "lessonText", label: "Bài khóa", icon: FileText },
 vocab: { key: "vocab", label: "Từ vựng", icon: BookOpen },
 grammar: { key: "grammar", label: "Ngữ pháp", icon: GraduationCap },
 review: { key: "review", label: "Ôn tập", icon: RotateCcw },
} satisfies Record<StudyModule, ModuleMeta>;

const flatTabs = studyModules.map(
 (key) => moduleMeta[key],
) satisfies SegmentedControlItem<StudyModule>[];

function parseStudyModule(
 value: string | null | undefined,
): StudyModule | null {
 return studyModules.some((item) => item === value)
  ? (value as StudyModule)
  : null;
}

function readSplitEnabled() {
 if (typeof window === "undefined") return false;

 return window.localStorage.getItem(splitEnabledKey) === "true";
}

function writeSplitEnabled(enabled: boolean) {
 if (typeof window === "undefined") return;

 window.localStorage.setItem(splitEnabledKey, enabled ? "true" : "false");
}

function uniqueModules(value: unknown) {
 if (!Array.isArray(value)) return [];

 const seen = new Set<StudyModule>();
 const result: StudyModule[] = [];

 for (const item of value) {
  const parsed = parseStudyModule(typeof item === "string" ? item : null);

  if (parsed && !seen.has(parsed)) {
   seen.add(parsed);
   result.push(parsed);
  }
 }

 return result;
}

function normalizePaneLayout(value: unknown): PaneLayout {
 if (!value || typeof value !== "object") return defaultPaneLayout;

 const input = value as Partial<PaneLayout>;
 const left = uniqueModules(input.left);
 const right = uniqueModules(input.right).filter(
  (item) => !left.includes(item),
 );
 const assigned = new Set<StudyModule>([...left, ...right]);

 for (const item of studyModules) {
  if (!assigned.has(item)) {
   right.push(item);
  }
 }

 if (left.length === 0 || right.length === 0) {
  return defaultPaneLayout;
 }

 const activeLeft = left.includes(input.activeLeft as StudyModule)
  ? (input.activeLeft as StudyModule)
  : left[0];

 const activeRight = right.includes(input.activeRight as StudyModule)
  ? (input.activeRight as StudyModule)
  : right[0];

 return {
  left,
  right,
  activeLeft,
  activeRight,
 };
}

function readPaneLayout() {
 if (typeof window === "undefined") return defaultPaneLayout;

 try {
  const stored = window.localStorage.getItem(paneLayoutKey);

  if (!stored) return defaultPaneLayout;

  return normalizePaneLayout(JSON.parse(stored));
 } catch {
  return defaultPaneLayout;
 }
}

function writePaneLayout(layout: PaneLayout) {
 if (typeof window === "undefined") return;

 window.localStorage.setItem(
  paneLayoutKey,
  JSON.stringify(normalizePaneLayout(layout)),
 );
}

function getPaneItems(layout: PaneLayout, paneId: PaneId) {
 return paneId === "left" ? layout.left : layout.right;
}

function setPaneActive(
 layout: PaneLayout,
 paneId: PaneId,
 module: StudyModule,
) {
 return normalizePaneLayout({
  ...layout,
  activeLeft: paneId === "left" ? module : layout.activeLeft,
  activeRight: paneId === "right" ? module : layout.activeRight,
 });
}

function moveModule(
 layout: PaneLayout,
 module: StudyModule,
 targetPane: PaneId,
) {
 const sourcePane = layout.left.includes(module) ? "left" : "right";
 const sourceItems = getPaneItems(layout, sourcePane);

 if (sourcePane === targetPane) {
  return setPaneActive(layout, targetPane, module);
 }

 if (sourceItems.length <= 1) {
  return layout;
 }

 const left = layout.left.filter((item) => item !== module);
 const right = layout.right.filter((item) => item !== module);

 if (targetPane === "left") {
  left.push(module);
 } else {
  right.push(module);
 }

 return normalizePaneLayout({
  left,
  right,
  activeLeft:
   targetPane === "left"
    ? module
    : layout.activeLeft === module
      ? left[0]
      : layout.activeLeft,
  activeRight:
   targetPane === "right"
    ? module
    : layout.activeRight === module
      ? right[0]
      : layout.activeRight,
 });
}

export function ModuleSplitWorkspace({
 lesson,
 learningState,
 activeModule,
 singleContent,
 onSelectModule,
 onBookmarkVocab,
 onMarkVocab,
 onBookmarkGrammar,
 onMarkGrammar,
 onAnswerReview,
}: ModuleSplitWorkspaceProps) {
 const [splitEnabled, setSplitEnabled] = useState(readSplitEnabled);
 const [layout, setLayout] = useState(readPaneLayout);
 const [draggedModule, setDraggedModule] = useState<StudyModule | null>(null);

 const normalizedLayout = useMemo(() => normalizePaneLayout(layout), [layout]);

 const updateSplitEnabled = (enabled: boolean) => {
  setSplitEnabled(enabled);
  writeSplitEnabled(enabled);
 };

 const updateLayout = (nextLayout: PaneLayout) => {
  const normalized = normalizePaneLayout(nextLayout);
  setLayout(normalized);
  writePaneLayout(normalized);
 };

 const handleSelectModule = (module: StudyModule) => {
  const paneId = normalizedLayout.left.includes(module) ? "left" : "right";
  updateLayout(setPaneActive(normalizedLayout, paneId, module));
  onSelectModule(module);
 };

 const handleMoveModule = (module: StudyModule, targetPane: PaneId) => {
  updateLayout(moveModule(normalizedLayout, module, targetPane));
  onSelectModule(module);
 };

 const renderModule = (module: StudyModule) => {
  switch (module) {
   case "overview":
    return (
     <LessonOverview
      lesson={lesson}
      learningState={learningState}
      onOpenModule={(module) => {
       const studyModule = parseStudyModule(module);

       if (studyModule) {
        handleSelectModule(studyModule);
       }
      }}
     />
    );
   case "lessonText":
    return <LessonTextInlineEditor lesson={lesson} />;
   case "vocab":
    return (
     <VocabWorkspace
      lesson={lesson}
      state={learningState}
      onBookmark={onBookmarkVocab}
      onMarkStatus={onMarkVocab}
      onOpenReview={() => handleSelectModule("review")}
     />
    );
   case "grammar":
    return (
     <GrammarWorkspace
      lesson={lesson}
      state={learningState}
      onBookmark={onBookmarkGrammar}
      onMarkStatus={onMarkGrammar}
     />
    );
   case "review":
    return (
     <ReviewWorkspace
      lesson={lesson}
      learningState={learningState}
      onAnswer={onAnswerReview}
     />
    );
  }
 };

 if (!splitEnabled) {
  return (
   <div className="grid gap-2.5">
    <div className="flex justify-end">
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => updateSplitEnabled(true)}
     >
      Mở split
     </Button>
    </div>

    <Tabs
     value={activeModule}
     items={flatTabs}
     onValueChange={onSelectModule}
     className="hanzihome-module-tabs grid gap-2.5"
    >
     {singleContent}
    </Tabs>
   </div>
  );
 }

 return (
  <div className="grid gap-2.5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     Kéo tab qua trái/phải để tự chia màn hình học.
    </p>

    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={() => updateSplitEnabled(false)}
    >
     Tắt split
    </Button>
   </div>

   <div className="grid min-w-0 gap-3 xl:h-[calc(100dvh-13rem)] xl:min-h-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <ModulePane
     paneId="left"
     title="Nội dung bài"
     items={normalizedLayout.left}
     activeModule={normalizedLayout.activeLeft}
     draggedModule={draggedModule}
     onSelectModule={handleSelectModule}
     onMoveModule={handleMoveModule}
     onDragStart={setDraggedModule}
     onDragEnd={() => setDraggedModule(null)}
    >
     {renderModule(normalizedLayout.activeLeft)}
    </ModulePane>

    <ModulePane
     paneId="right"
     title="Học & ôn"
     items={normalizedLayout.right}
     activeModule={normalizedLayout.activeRight}
     draggedModule={draggedModule}
     onSelectModule={handleSelectModule}
     onMoveModule={handleMoveModule}
     onDragStart={setDraggedModule}
     onDragEnd={() => setDraggedModule(null)}
    >
     {renderModule(normalizedLayout.activeRight)}
    </ModulePane>
   </div>
  </div>
 );
}

function ModulePane({
 paneId,
 title,
 items,
 activeModule,
 draggedModule,
 children,
 onSelectModule,
 onMoveModule,
 onDragStart,
 onDragEnd,
}: {
 paneId: PaneId;
 title: string;
 items: StudyModule[];
 activeModule: StudyModule;
 draggedModule: StudyModule | null;
 children: ReactNode;
 onSelectModule: (module: StudyModule) => void;
 onMoveModule: (module: StudyModule, paneId: PaneId) => void;
 onDragStart: (module: StudyModule) => void;
 onDragEnd: () => void;
}) {
 const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
 };

 const handleDrop = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault();

  const droppedModule = parseStudyModule(
   event.dataTransfer.getData("text/plain"),
  );
  onDragEnd();

  if (droppedModule) {
   onMoveModule(droppedModule, paneId);
  }
 };

 return (
  <section
   onDragOver={handleDragOver}
   onDrop={handleDrop}
   className="grid min-h-112 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm xl:min-h-0"
  >
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="text-sm font-black uppercase tracking-wide text-text-primary">
     {title}
    </h2>

    <span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-black text-text-muted">
     {items.length} tab
    </span>
   </div>

   <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-xl bg-bg-subtle p-1">
    {items.map((item) => (
     <ModuleTabButton
      key={item}
      item={item}
      active={item === activeModule}
      dragging={item === draggedModule}
      onClick={() => onSelectModule(item)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
     />
    ))}
   </div>

   <div className="min-h-0 min-w-0 overflow-y-auto rounded-xl bg-bg-subtle/60 p-2 pr-1">
    {children}
   </div>
  </section>
 );
}

function ModuleTabButton({
 item,
 active,
 dragging,
 onClick,
 onDragStart,
 onDragEnd,
}: {
 item: StudyModule;
 active: boolean;
 dragging: boolean;
 onClick: () => void;
 onDragStart: (module: StudyModule) => void;
 onDragEnd: () => void;
}) {
 const meta = moduleMeta[item];
 const Icon = meta.icon;

 const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", item);
  onDragStart(item);
 };

 return (
  <button
   type="button"
   draggable
   onClick={onClick}
   onDragStart={handleDragStart}
   onDragEnd={onDragEnd}
   className={[
    "flex h-10 shrink-0 cursor-grab items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-black transition-colors active:cursor-grabbing",
    active
     ? "bg-bg-primary text-text-primary shadow-theme-sm"
     : "text-text-muted hover:bg-bg-primary hover:text-text-primary",
    dragging ? "opacity-50" : "",
   ].join(" ")}
  >
   <GripVertical className="h-3.5 w-3.5 text-text-muted" />
   <Icon className="h-4 w-4" />
   {meta.label}
  </button>
 );
}
