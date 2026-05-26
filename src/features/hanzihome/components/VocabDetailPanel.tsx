"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
import { VocabEditDialog } from "@/features/hanzihome/components/VocabEditDialog";
import { SaveMemoryTipButton } from "@/features/hanzihome/memory-tips/SaveMemoryTipButton";
import type {
 LearningStatus,
 VocabViewModel,
} from "@/features/hanzihome/types";

type DetailSection = VocabViewModel["detailSections"][number];
type SectionView =
 | "all"
 | "meaning"
 | "etymology"
 | "comparisons"
 | "examples"
 | "notes";

const sectionShortcutTabs: Array<{
 key: SectionView;
 label: string;
 shortcut: string;
}> = [
 { key: "all", label: "Tất cả", shortcut: "1" },
 { key: "meaning", label: "Nghĩa", shortcut: "2" },
 { key: "etymology", label: "Logic", shortcut: "3" },
 { key: "comparisons", label: "So sánh", shortcut: "4" },
 { key: "examples", label: "Ví dụ", shortcut: "5" },
 { key: "notes", label: "Lưu ý", shortcut: "6" },
];

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
 word: VocabViewModel | null;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 lessonId?: string;
 canEditDbContent?: boolean;
 editDraftId?: string;
 editItemId?: string;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 bookmarked,
 onBookmark,
 lessonId,
 canEditDbContent = false,
 editDraftId,
 editItemId,
}: VocabDetailPanelProps) {
 const [sectionView, setSectionView] = useState<SectionView>("all");

 useEffect(() => {
  if (!word) return;

  const availableSectionKeys = new Set(
   word.detailSections.map((section) => section.key),
  );
  const availableTabs = sectionShortcutTabs.filter((item) => {
   if (item.key === "all") return true;
   if (item.key === "examples") return word.examplesParsed.length > 0;
   if (item.key === "notes") return availableSectionKeys.has("notes");
   return availableSectionKeys.has(item.key);
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

 const sectionByKey = new Map(
  word.detailSections.map((section) => [section.key, section]),
 );
 const isSection = (
  section: DetailSection | undefined,
 ): section is DetailSection => Boolean(section);
 const orderedSections = [
  sectionByKey.get("meaning"),
  sectionByKey.get("etymology"),
  sectionByKey.get("comparisons"),
  sectionByKey.get("collocations"),
 ].filter(isSection);
 const trailingSections = [
  sectionByKey.get("culture"),
  sectionByKey.get("notes"),
 ].filter(isSection);
 const sectionTabs = [
  ...sectionShortcutTabs,
 ].filter((item) => {
  if (item.key === "all") return true;
  if (item.key === "examples") return word.examplesParsed.length > 0;
  if (item.key === "notes") return sectionByKey.has("notes");
  return sectionByKey.has(item.key);
 });
 const effectiveSectionView = sectionTabs.some((item) => item.key === sectionView)
  ? sectionView
  : "all";
 const visibleOrderedSections = orderedSections.filter(
  (section) =>
   effectiveSectionView === "all" || section.key === effectiveSectionView,
 );
 const showExamples =
  effectiveSectionView === "all" || effectiveSectionView === "examples";
 const visibleTrailingSections = trailingSections.filter((section) => {
  if (effectiveSectionView === "all") return true;
  if (effectiveSectionView === "notes") return section.key === "notes";
  return section.key === effectiveSectionView;
 });

 return (
  <Card
   padding="lg"
   className="rounded-xl border border-border-default bg-bg-primary shadow-theme-sm"
  >
   <article className="flex flex-col gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <h2 className="text-5xl font-black tracking-normal text-text-primary">
        {word.word}
        <p className="text-lg font-black">{word.pinyin}</p>
       </h2>

       <div className="flex flex-col gap-2">
        {word.pos?.vi && <Badge variant="info">{word.pos.vi}</Badge>}
        {word.level && <Badge>{word.level}</Badge>}
       </div>
      </div>
      <p className="text-sm font-bold text-text-secondary">
       {word.hanViet} · {word.meaning}
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      {canEditDbContent && lessonId ? (
       <VocabEditDialog lessonId={lessonId} word={word} />
      ) : null}

      {!canEditDbContent && !editDraftId && (
       <Button
        type="button"
        variant="outline"
        disabled
        title="Bài fallback tĩnh không thể sửa trực tiếp."
       >
        Sửa
       </Button>
      )}

      {editDraftId && editItemId && (
       <InlineDraftItemEditDialog
        kind="vocab"
        draftId={editDraftId}
        itemId={editItemId}
        />
      )}

      <SaveMemoryTipButton
       payload={{
        tipType: "vocab",
        title: `${word.word} · ${word.pinyin}`,
        body: `${word.hanViet} · ${word.meaning}`,
        exampleZh: word.examplesParsed[0]?.zh,
        examplePinyin: word.examplesParsed[0]?.pinyin,
        exampleVi: word.examplesParsed[0]?.vi,
        sourceType: "vocab",
        sourceLessonId: lessonId,
        sourceItemId: word.id,
        sourceLabel: word.word,
        tags: ["vocab", word.category].filter(Boolean),
        weight: 2,
       }}
      />

      <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
       <Bookmark className="h-4 w-4" />
       {bookmarked ? "Đã lưu" : "Lưu"}
      </Button>
     </div>
    </div>

    <nav className="flex flex-wrap gap-2" aria-label="Điều hướng phần từ vựng">
     {sectionTabs.map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => setSectionView(item.key)}
       className={[
        "rounded-full border px-3 py-1 text-xs font-black transition-colors",
        effectiveSectionView === item.key
         ? "border-accent bg-accent"
         : "border-border-default bg-bg-subtle text-text-muted hover:text-text-primary",
       ].join(" ")}
      >
       <span>{item.label}</span>
       <kbd className="ml-2 rounded bg-bg-primary px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
        {item.shortcut}
       </kbd>
      </button>
     ))}
    </nav>
    {showExamples && word.examplesParsed.length > 0 && (
     <ReadingSection id="vocab-examples" title="Ví dụ">
      {word.examplesParsed.map((example) => (
       <div
        key={`${example.zh}-${example.vi}`}
        className="grid gap-1 rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
       >
        <p className="text-base font-black leading-relaxed text-text-primary">
         {example.zh}
        </p>
        {example.pinyin && (
         <p className="text-sm font-bold leading-relaxed">
          {example.pinyin}
         </p>
        )}
        {example.vi && (
         <p className="text-sm font-semibold leading-relaxed text-text-secondary">
          {example.vi}
         </p>
        )}
        {example.note && (
         <p className="border-t border-border-default pt-2 text-sm leading-relaxed text-text-muted">
          {example.note}
         </p>
        )}
       </div>
      ))}
     </ReadingSection>
    )}

    {visibleOrderedSections.map((section) => (
     <ReadingSection
      key={section.key}
      id={`vocab-${section.key}`}
      title={section.title}
     >
      {section.lines.map((line) => (
       <p key={line}>{line}</p>
      ))}
     </ReadingSection>
    ))}

    {visibleTrailingSections.map((section) => (
     <ReadingSection
      key={section.key}
      id={`vocab-${section.key}`}
      title={section.title}
     >
      {section.lines.map((line) => (
       <p key={line}>{line}</p>
      ))}
     </ReadingSection>
    ))}
   </article>
  </Card>
 );
}

function ReadingSection({
 id,
 title,
 children,
}: {
 id: string;
 title: string;
 children: ReactNode;
}) {
 return (
  <details
   id={id}
   open
   className="group rounded-xl border border-border-default bg-bg-subtle p-4"
  >
   <summary className="cursor-pointer text-base font-black text-text-primary">
    {title}
   </summary>
   <div className="grid gap-3 text-base leading-relaxed text-text-secondary">
    {children}
   </div>
  </details>
 );
}
