"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
 HanziHomeVocabItem,
 LearningStatus,
} from "@/features/hanzihome/types";

import {
 hasCultureContent,
 hasSectionInItem,
 hasWarningContent,
} from "./content-checks";
import { sectionShortcutTabs, type SectionView } from "./types";
import { VocabDetailHeader } from "./VocabDetailHeader";
import {
 CultureSection,
 StructuredVocabSections,
 WarningSection,
 WordFormationPreview,
} from "./VocabDetailSections";
import { cn } from "@/lib/utils";

function isTypingTarget(element: Element | null) {
 return (
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  element?.getAttribute("role") === "textbox" ||
  Boolean(element?.closest("[contenteditable='true'], [data-editor-root]"))
 );
}

type VocabDetailPanelProps = {
 word: HanziHomeVocabItem | null;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 lessonId?: string;
 compact?: boolean;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 bookmarked,
 onBookmark,
 lessonId,
 compact = false,
}: VocabDetailPanelProps) {
 const [sectionView, setSectionView] = useState<SectionView>("all");

 useEffect(() => {
  if (!word) return;

  const availableTabs = sectionShortcutTabs.filter((item) => {
   return hasSectionInItem(word, item.key);
  });

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
   }

   if (isTypingTarget(document.activeElement)) return;

   const nextTab = availableTabs.find((item) => item.shortcut === event.key);

   if (!nextTab) return;

   event.preventDefault();
   setSectionView(nextTab.key);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   window.removeEventListener("keydown", handleKeyDown);
  };
 }, [word]);

 if (!word) {
  return (
   <Card
    padding="lg"
    className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
   >
    <p className="text-sm font-semibold text-text-muted">
     Chọn một từ để xem chi tiết.
    </p>
   </Card>
  );
 }

 const sectionTabs = [...sectionShortcutTabs].filter((item) => {
  return hasSectionInItem(word, item.key);
 });
 const effectiveSectionView = sectionTabs.some(
  (item) => item.key === sectionView,
 )
  ? sectionView
  : "all";

 return (
  <article
   className={cn(
    "grid gap-4",
    !compact && "xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start",
   )}
  >
   <div className="grid min-w-0 gap-4">
    <Card
     padding={compact ? "md" : "lg"}
     className="rounded-2xl border border-border-default bg-bg-primary shadow-theme-sm"
    >
     <div className="grid gap-4">
      <VocabDetailHeader
       word={word}
       bookmarked={bookmarked}
       lessonId={lessonId}
       compact={compact}
       onBookmark={onBookmark}
      />

      <nav
       className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
       aria-label="Điều hướng phần từ vựng"
      >
       {sectionTabs.map((item) => (
        <Button
         key={item.key}
         type="button"
         onClick={() => setSectionView(item.key)}
         variant={item.key === effectiveSectionView ? "default" : "outline"}
        >
         <span>{item.label}</span>
         <kbd className="ml-2 rounded-full bg-bg-subtle px-2 py-0.5 text-[0.65rem] font-black text-text-muted">
          {item.shortcut}
         </kbd>
        </Button>
       ))}
      </nav>
     </div>
    </Card>

    <div className="grid gap-4">
     <StructuredVocabSections
      item={word}
      sectionView={effectiveSectionView}
      keyword={word.hanzi}
     />
    </div>
   </div>

   <aside
    className={cn(
     "grid gap-4",
     !compact &&
      "xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1",
    )}
   >
    <WordFormationPreview formation={word.word_formation} word={word} />

    {hasCultureContent(word.culture_note) && (
     <CultureSection culture={word.culture_note} />
    )}
    {hasWarningContent(word.warnings) && (
     <WarningSection warnings={word.warnings} />
    )}
   </aside>
  </article>
 );
}
