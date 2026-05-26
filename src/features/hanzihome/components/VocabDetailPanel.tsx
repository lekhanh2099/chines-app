"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BookOpen, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
import { VocabEditDialog } from "@/features/hanzihome/components/VocabEditDialog";
import { VocabWritingCue } from "@/features/hanzihome/components/VocabWritingCue";
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
 { key: "examples", label: "Ví dụ", shortcut: "5" },
 { key: "meaning", label: "Nghĩa", shortcut: "2" },
 { key: "etymology", label: "Logic", shortcut: "3" },
 { key: "comparisons", label: "So sánh", shortcut: "4" },
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

 console.log("Rendering VocabDetailPanel with word:", { word, sectionByKey });

 const sectionTabs = [...sectionShortcutTabs].filter((item) => {
  if (item.key === "all") return true;
  if (item.key === "examples") return word.examplesParsed.length > 0;
  if (item.key === "notes") return sectionByKey.has("notes");
  return sectionByKey.has(item.key);
 });
 const effectiveSectionView = sectionTabs.some(
  (item) => item.key === sectionView,
 )
  ? sectionView
  : "all";
 const visibleOrderedSections = orderedSections.filter(
  (section) =>
   effectiveSectionView === "all" || section.key === effectiveSectionView,
 );
 const showExamples =
  effectiveSectionView === "all" || effectiveSectionView === "examples";

 return (
  <article className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
   <div className="grid min-w-0 gap-4">
    <Card
     padding="lg"
     className="rounded-2xl border border-border-default bg-bg-primary shadow-theme-sm"
    >
     <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
         <h2 className="font-hanzi text-6xl font-black leading-none tracking-normal text-text-primary">
          {word.word}
         </h2>
         <p className="text-xl font-black text-accent-text">{word.pinyin}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
         {word.pos?.vi && <Badge variant="info">{word.pos.vi}</Badge>}
         {word.level && <Badge variant="danger">{word.level}</Badge>}
        </div>

        <p className="mt-2 max-w-2xl text-base font-black leading-relaxed text-text-secondary">
         {word.hanViet} · {word.meaning}
        </p>
       </div>

       <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
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

        <Button
         variant={bookmarked ? "default" : "outline"}
         onClick={onBookmark}
        >
         <Bookmark className="h-4 w-4" />
         {bookmarked ? "Đã lưu" : "Lưu"}
        </Button>
       </div>
      </div>

      <nav
       className="flex gap-2 overflow-x-auto pb-1"
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
     {showExamples && word.examplesParsed.length > 0 && (
      <VocabExamplesSection word={word} />
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
    </div>
   </div>

   <aside className="grid gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
    <VocabWritingCue word={word} size={168} compact autoPlay />
    {trailingSections.map((section) => (
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
   </aside>
  </article>
 );
}

function VocabExamplesSection({ word }: { word: VocabViewModel }) {
 return (
  <section
   id="vocab-examples"
   className="grid gap-4 rounded-2xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
  >
   <div className="flex items-center justify-between gap-3">
    <h3 className="flex items-center gap-2 text-lg font-black text-text-primary">
     <BookOpen className="h-5 w-5 text-accent-text" />
     Ví dụ (Examples)
    </h3>
   </div>

   <div className="grid gap-3">
    {word.examplesParsed.map((example, index) => (
     <div
      key={`${example.zh}-${example.vi}`}
      className={[
       "grid gap-2 rounded-xl border p-4",
       index === 0
        ? "border-accent/30 bg-bg-subtle shadow-theme-sm"
        : "border-border-default bg-bg-primary",
      ].join(" ")}
     >
      <div className="border-l-4 border-accent pl-4">
       <p className="text-base font-black leading-relaxed text-text-primary">
        {renderHighlightedText(example.zh, word.word)}
       </p>
       {example.pinyin && (
        <p className="mt-1 text-sm font-bold italic leading-relaxed text-text-muted">
         {example.pinyin}
        </p>
       )}
       {example.vi && (
        <p className="mt-2 text-sm font-semibold leading-relaxed text-text-secondary">
         {example.vi}
        </p>
       )}
      </div>

      {example.note && (
       <p className="border-t border-border-default pt-2 text-sm leading-relaxed text-text-muted">
        {example.note}
       </p>
      )}
     </div>
    ))}
   </div>
  </section>
 );
}

function renderHighlightedText(text: string, keyword: string) {
 if (!keyword || !text.includes(keyword)) return text;

 return text.split(keyword).map((part, index, parts) => (
  <span key={`${part}-${index}`}>
   {part}
   {index < parts.length - 1 && (
    <mark className="bg-transparent font-black text-accent-text">
     {keyword}
    </mark>
   )}
  </span>
 ));
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
