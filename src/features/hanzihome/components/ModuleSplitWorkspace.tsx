"use client";

import { type DragEvent, type ReactNode, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  NotebookPen,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  SegmentedControl,
  type SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import { DebugRawDataPanel } from "@/features/hanzihome/components/lesson-overview/StudySection";
import type {
  HanziHomeLesson,
  HanziHomeModule,
  LearningStatus,
  ReviewResult,
  UserLearningState,
} from "@/features/hanzihome/types";

type StudyModule = Exclude<HanziHomeModule, "radicals">;
type PaneId = "left" | "right";
type LessonViewMode = "study" | "debug";
type DraggedModule = {
  module: StudyModule;
  sourcePane: PaneId;
};

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
const lessonViewModeKey = "hanzihome:lesson-view-mode:v1";
const splitPaneSizeKey = "hanzihome:module-split-size:v1";

const studyModules = [
  "overview",
  "lessonText",
  "notes",
  "vocab",
  "grammar",
  "review",
] as const satisfies readonly StudyModule[];

const defaultPaneLayout: PaneLayout = {
  left: ["overview", "lessonText", "notes"],
  right: ["vocab", "grammar", "review"],
  activeLeft: "overview",
  activeRight: "vocab",
};

const moduleMeta = {
  overview: { key: "overview", label: "Tổng quan", icon: Home },
  lessonText: { key: "lessonText", label: "Bài khóa", icon: FileText },
  notes: { key: "notes", label: "Ghi chú", icon: NotebookPen },
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

function readLessonViewMode(): LessonViewMode {
  if (typeof window === "undefined") return "study";

  return window.localStorage.getItem(lessonViewModeKey) === "debug"
    ? "debug"
    : "study";
}

function writeLessonViewMode(mode: LessonViewMode) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(lessonViewModeKey, mode);
}

function readSplitPaneSize() {
  if (typeof window === "undefined") return 48;

  const stored = Number(window.localStorage.getItem(splitPaneSizeKey));

  return Number.isFinite(stored) && stored >= 38 && stored <= 62 ? stored : 48;
}

function writeSplitPaneSize(size: number) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(splitPaneSizeKey, String(size));
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

function getPaneItems(layout: PaneLayout, paneId: PaneId) {
  return paneId === "left" ? layout.left : layout.right;
}

function moveModuleInLayout({
  layout,
  module,
  targetPane,
  targetIndex,
}: {
  layout: PaneLayout;
  module: StudyModule;
  targetPane: PaneId;
  targetIndex: number;
}) {
  const sourcePane = layout.left.includes(module) ? "left" : "right";
  const sourceItems = getPaneItems(layout, sourcePane);

  if (!sourceItems.includes(module)) {
    return layout;
  }

  if (sourcePane !== targetPane && sourceItems.length <= 1) {
    return layout;
  }

  const nextLeft = layout.left.filter((item) => item !== module);
  const nextRight = layout.right.filter((item) => item !== module);
  const targetItems = targetPane === "left" ? nextLeft : nextRight;
  const insertIndex = Math.max(0, Math.min(targetIndex, targetItems.length));

  targetItems.splice(insertIndex, 0, module);

  return normalizePaneLayout({
    left: nextLeft,
    right: nextRight,
    activeLeft:
      targetPane === "left"
        ? module
        : nextLeft.includes(layout.activeLeft)
          ? layout.activeLeft
          : nextLeft[0],
    activeRight:
      targetPane === "right"
        ? module
        : nextRight.includes(layout.activeRight)
          ? layout.activeRight
          : nextRight[0],
  });
}

function isSamePaneLayout(left: PaneLayout, right: PaneLayout) {
  return (
    left.activeLeft === right.activeLeft &&
    left.activeRight === right.activeRight &&
    left.left.join("|") === right.left.join("|") &&
    left.right.join("|") === right.right.join("|")
  );
}

export function ModuleSplitWorkspace({
  lesson,
  learningState,
  activeModule,
  onSelectModule,
  onBookmarkVocab,
  onMarkVocab,
  onBookmarkGrammar,
  onMarkGrammar,
  onAnswerReview,
}: ModuleSplitWorkspaceProps) {
  const [splitEnabled, setSplitEnabled] = useState(readSplitEnabled);
  const [layout, setLayout] = useState(readPaneLayout);
  const [draggedModule, setDraggedModule] = useState<DraggedModule | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<LessonViewMode>(readLessonViewMode);
  const [splitPaneSize, setSplitPaneSize] = useState(readSplitPaneSize);

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

  const updateViewMode = (mode: LessonViewMode) => {
    setViewMode(mode);
    writeLessonViewMode(mode);
  };

  const moveModule = (
    module: StudyModule,
    targetPane: PaneId,
    targetIndex: number,
  ) => {
    const nextLayout = moveModuleInLayout({
      layout: normalizedLayout,
      module,
      targetPane,
      targetIndex,
    });

    if (isSamePaneLayout(normalizedLayout, nextLayout)) {
      return;
    }

    updateLayout(nextLayout);
    onSelectModule(module);
  };

  const renderModule = (module: StudyModule, compact = false) => {
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
        return <LessonTextInlineEditor lesson={lesson} compact={compact} />;
      case "notes":
        return <LessonNoteAccessCard lesson={lesson} />;
      case "vocab":
        return (
          <VocabWorkspace
            lesson={lesson}
            state={learningState}
            compact={compact}
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
            compact={compact}
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
            onToggleBookmark={(scope, id) =>
              scope === "vocab" ? onBookmarkVocab(id) : onBookmarkGrammar(id)
            }
          />
        );
    }
  };

  const debugPanel =
    viewMode === "debug" && activeModule !== "overview" ? (
      <DebugRawDataPanel
        title="Raw lesson JSON"
        value={lesson.sourceLesson ?? lesson}
      />
    ) : null;

  if (!splitEnabled) {
    return (
      <div className="grid gap-2">
        <div className="sticky top-0 z-30 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-card/95 p-1 shadow-theme-sm backdrop-blur">
          <div className="min-w-0 flex-1">
            <SegmentedControl
              value={activeModule}
              items={flatTabs}
              onChange={onSelectModule}
              className="bg-transparent p-0 shadow-none"
              itemClassName="h-8 px-2 text-sm sm:px-2.5"
            />
          </div>
          <LessonViewModeToggle mode={viewMode} onChange={updateViewMode} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5 text-sm"
            onClick={() => updateSplitEnabled(true)}
          >
            Mở split
          </Button>
        </div>

        {renderModule(activeModule)}
        {debugPanel}
      </div>
    );
  }

  return (
    <div className="grid gap-2 xl:h-[calc(100dvh-8.25rem)] xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-hidden">
      <div className="sticky top-0 z-30 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-card/95 p-1 shadow-theme-sm backdrop-blur">
        <div className="min-w-0 px-2">
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
            Split mode
          </p>
          <p className="hidden text-xs font-bold text-text-muted sm:block">
            Kéo tab giữa hai pane, kéo divider để đổi kích thước.
          </p>
        </div>
        <LessonViewModeToggle mode={viewMode} onChange={updateViewMode} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-2.5 text-sm"
          onClick={() => updateSplitEnabled(false)}
        >
          Tắt split
        </Button>
      </div>

      <div className="grid min-w-0 gap-2 xl:hidden">
        <ModulePane
          title="Nội dung"
          items={normalizedLayout.left}
          activeModule={normalizedLayout.activeLeft}
          paneId="left"
          draggedModule={draggedModule}
          onDragStart={setDraggedModule}
          onDragEnd={() => setDraggedModule(null)}
          onMoveModule={moveModule}
          onSelectModule={(module) => {
            updateLayout(setPaneActive(normalizedLayout, "left", module));
            onSelectModule(module);
          }}
        >
          {renderModule(normalizedLayout.activeLeft, true)}
        </ModulePane>

        <ModulePane
          title="Học & ôn"
          items={normalizedLayout.right}
          activeModule={normalizedLayout.activeRight}
          paneId="right"
          draggedModule={draggedModule}
          onDragStart={setDraggedModule}
          onDragEnd={() => setDraggedModule(null)}
          onMoveModule={moveModule}
          onSelectModule={(module) => {
            updateLayout(setPaneActive(normalizedLayout, "right", module));
            onSelectModule(module);
          }}
        >
          {renderModule(normalizedLayout.activeRight, true)}
        </ModulePane>
      </div>

      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={{
          left: splitPaneSize,
          right: 100 - splitPaneSize,
        }}
        className="hidden min-h-0 min-w-0 overflow-hidden xl:flex xl:h-full"
      >
        <ResizablePanel
          id="left"
          className="min-h-0 min-w-0 overflow-hidden"
          minSize={38}
          defaultSize={splitPaneSize}
          onResize={(panelSize) => {
            const nextSize = Math.round(panelSize.asPercentage);

            setSplitPaneSize(nextSize);
            writeSplitPaneSize(nextSize);
          }}
        >
          <ModulePane
            title="Nội dung"
            items={normalizedLayout.left}
            activeModule={normalizedLayout.activeLeft}
            paneId="left"
            draggedModule={draggedModule}
            className="h-full"
            onDragStart={setDraggedModule}
            onDragEnd={() => setDraggedModule(null)}
            onMoveModule={moveModule}
            onSelectModule={(module) => {
              updateLayout(setPaneActive(normalizedLayout, "left", module));
              onSelectModule(module);
            }}
          >
            {renderModule(normalizedLayout.activeLeft, true)}
          </ModulePane>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel
          id="right"
          className="min-h-0 min-w-0 overflow-hidden"
          minSize={38}
          defaultSize={100 - splitPaneSize}
        >
          <ModulePane
            title="Học & ôn"
            items={normalizedLayout.right}
            activeModule={normalizedLayout.activeRight}
            paneId="right"
            draggedModule={draggedModule}
            className="h-full"
            onDragStart={setDraggedModule}
            onDragEnd={() => setDraggedModule(null)}
            onMoveModule={moveModule}
            onSelectModule={(module) => {
              updateLayout(setPaneActive(normalizedLayout, "right", module));
              onSelectModule(module);
            }}
          >
            {renderModule(normalizedLayout.activeRight, true)}
          </ModulePane>
        </ResizablePanel>
      </ResizablePanelGroup>

      {debugPanel}
    </div>
  );
}

function LessonViewModeToggle({
  mode,
  onChange,
}: {
  mode: LessonViewMode;
  onChange: (mode: LessonViewMode) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg bg-bg-subtle p-1">
      {(["study", "debug"] as const).map((value) => (
        <Button
          key={value}
          type="button"
          variant={mode === value ? "default" : "ghost"}
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onChange(value)}
        >
          {value === "study" ? "Study" : "Debug"}
        </Button>
      ))}
    </div>
  );
}

function ModulePane({
  title,
  items,
  activeModule,
  children,
  onSelectModule,
  paneId,
  draggedModule,
  className = "",
  onDragStart,
  onDragEnd,
  onMoveModule,
}: {
  title: string;
  items: StudyModule[];
  activeModule: StudyModule;
  children: ReactNode;
  onSelectModule: (module: StudyModule) => void;
  paneId: PaneId;
  draggedModule: DraggedModule | null;
  className?: string;
  onDragStart: (dragged: DraggedModule) => void;
  onDragEnd: () => void;
  onMoveModule: (
    module: StudyModule,
    targetPane: PaneId,
    targetIndex: number,
  ) => void;
}) {
  const canDropIntoPane =
    draggedModule !== null &&
    (draggedModule.sourcePane !== paneId ||
      !items.includes(draggedModule.module));

  const handleDropIntoPane = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (draggedModule) {
      onMoveModule(draggedModule.module, paneId, items.length);
      onDragEnd();
    }
  };

  return (
    <section
      className={[
        "grid min-h-112 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-xl border border-border-default bg-bg-card p-2 shadow-theme-sm xl:h-full xl:min-h-0",
        className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
            {title}
          </h2>
          <p className="line-clamp-1 text-sm font-black text-text-primary">
            {moduleMeta[activeModule].label}
          </p>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden">
        <div
          className={[
            "no-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-transparent bg-bg-subtle p-1 transition-colors",
            canDropIntoPane ? "border-dashed border-accent/60" : "",
          ].join(" ")}
          onDragOver={(event) => {
            if (draggedModule) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={handleDropIntoPane}
        >
          {items.map((item, index) => (
            <ModuleTabButton
              key={item}
              item={item}
              active={item === activeModule}
              paneId={paneId}
              index={index}
              draggedModule={draggedModule}
              onClick={() => onSelectModule(item)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMoveModule={onMoveModule}
            />
          ))}
        </div>

        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-lg bg-bg-subtle/60 p-1 scrollbar-soft sm:rounded-xl sm:p-2 sm:pr-1">
          {children}
        </div>
      </div>
    </section>
  );
}

function ModuleTabButton({
  item,
  active,
  paneId,
  index,
  draggedModule,
  onClick,
  onDragStart,
  onDragEnd,
  onMoveModule,
}: {
  item: StudyModule;
  active: boolean;
  paneId: PaneId;
  index: number;
  draggedModule: DraggedModule | null;
  onClick: () => void;
  onDragStart: (dragged: DraggedModule) => void;
  onDragEnd: () => void;
  onMoveModule: (
    module: StudyModule,
    targetPane: PaneId,
    targetIndex: number,
  ) => void;
}) {
  const meta = moduleMeta[item];
  const Icon = meta.icon;
  const isDragging = draggedModule?.module === item;
  const isDropTarget =
    draggedModule !== null &&
    draggedModule.module !== item &&
    (draggedModule.sourcePane !== paneId ||
      draggedModule.module !== item);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    onDragStart({ module: item, sourcePane: paneId });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item);
    event.dataTransfer.setDragImage(
      event.currentTarget,
      event.currentTarget.offsetWidth / 2,
      event.currentTarget.offsetHeight / 2,
    );
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (draggedModule?.module) {
      onMoveModule(draggedModule.module, paneId, index);
    }

    onDragEnd();
  };

  return (
    <button
      type="button"
      draggable
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragOver={(event) => {
        if (draggedModule) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
      className={[
        "flex h-8 shrink-0 cursor-grab select-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-2.5 text-sm font-black transition-colors active:cursor-grabbing sm:gap-2",
        active
          ? "bg-bg-primary text-text-primary shadow-theme-sm"
          : "text-text-muted hover:bg-bg-primary hover:text-text-primary",
        isDragging ? "opacity-40" : "",
        isDropTarget ? "hover:border-accent/60" : "",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </button>
  );
}
