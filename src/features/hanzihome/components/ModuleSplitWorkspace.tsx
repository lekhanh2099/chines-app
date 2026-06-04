"use client";

import { type ReactNode, useMemo, useState } from "react";
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
  SegmentedControl,
  type SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonNoteAccessCard } from "@/features/hanzihome/components/LessonNoteAccessCard";
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
  const [collapsedPane, setCollapsedPane] = useState<PaneId | null>(null);

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
          />
        );
    }
  };

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

        {singleContent}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="sticky top-0 z-30 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-card/95 p-1 shadow-theme-sm backdrop-blur">
        <div className="min-w-0 flex-1">
          <SegmentedControl
            value={activeModule}
            items={flatTabs}
            onChange={handleSelectModule}
            className="bg-transparent p-0 shadow-none"
            itemClassName="h-8 px-2 text-sm sm:px-2.5"
          />
        </div>
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

      <div
        className={[
          "grid min-w-0 gap-2 xl:h-[calc(100dvh-8.25rem)] xl:min-h-0",
          collapsedPane === "left"
            ? "xl:grid-cols-[2.75rem_minmax(0,1fr)]"
            : collapsedPane === "right"
              ? "xl:grid-cols-[minmax(0,1fr)_2.75rem]"
              : "xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
        ].join(" ")}
      >
        <ModulePane
          title="Nội dung"
          items={normalizedLayout.left}
          activeModule={normalizedLayout.activeLeft}
          collapsed={collapsedPane === "left"}
          onToggleCollapse={() =>
            setCollapsedPane((current) => (current === "left" ? null : "left"))
          }
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
          collapsed={collapsedPane === "right"}
          onToggleCollapse={() =>
            setCollapsedPane((current) =>
              current === "right" ? null : "right",
            )
          }
          onSelectModule={(module) => {
            updateLayout(setPaneActive(normalizedLayout, "right", module));
            onSelectModule(module);
          }}
        >
          {renderModule(normalizedLayout.activeRight, true)}
        </ModulePane>
      </div>
    </div>
  );
}

function ModulePane({
  title,
  items,
  activeModule,
  collapsed,
  children,
  onSelectModule,
  onToggleCollapse,
}: {
  title: string;
  items: StudyModule[];
  activeModule: StudyModule;
  collapsed: boolean;
  children: ReactNode;
  onSelectModule: (module: StudyModule) => void;
  onToggleCollapse: () => void;
}) {
  return (
    <section
      className={[
        "grid min-h-112 min-w-0 gap-2 rounded-xl border border-border-default bg-bg-card p-2 shadow-theme-sm xl:min-h-0",
        collapsed
          ? "grid-rows-1 overflow-hidden"
          : "grid-rows-[auto_minmax(0,1fr)]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className={
            collapsed ? "min-w-0 [writing-mode:vertical-rl]" : "min-w-0"
          }
        >
          <h2 className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
            {title}
          </h2>
          {!collapsed && (
            <p className="line-clamp-1 text-sm font-black text-text-primary">
              {moduleMeta[activeModule].label}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border-default bg-bg-primary px-2 text-xs font-bold text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
        >
          {collapsed ? "Mở" : "Ẩn"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-bg-subtle p-1">
            {items.map((item) => (
              <ModuleTabButton
                key={item}
                item={item}
                active={item === activeModule}
                onClick={() => onSelectModule(item)}
              />
            ))}
          </div>

          <div className="min-h-0 min-w-0 overflow-y-auto rounded-lg bg-bg-subtle/60 p-1 sm:rounded-xl sm:p-2 sm:pr-1">
            {children}
          </div>
        </>
      )}
    </section>
  );
}

function ModuleTabButton({
  item,
  active,
  onClick,
}: {
  item: StudyModule;
  active: boolean;
  onClick: () => void;
}) {
  const meta = moduleMeta[item];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-black transition-colors sm:gap-2",
        active
          ? "bg-bg-primary text-text-primary shadow-theme-sm"
          : "text-text-muted hover:bg-bg-primary hover:text-text-primary",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {meta.label}
    </button>
  );
}
