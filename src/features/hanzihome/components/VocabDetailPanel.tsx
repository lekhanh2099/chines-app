"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bookmark, CheckCircle2, Circle, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineDraftItemEditDialog } from "@/features/hanzihome/components/InlineDraftItemEditDialog";
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

type VocabDetailPanelProps = {
 word: VocabViewModel | null;
 status: LearningStatus;
 bookmarked: boolean;
 onBookmark: () => void;
 editDraftId?: string;
 editItemId?: string;
 onMarkStatus: (status: LearningStatus) => void;
};

export function VocabDetailPanel({
 word,
 status,
 bookmarked,
 onBookmark,
 editDraftId,
 editItemId,
 onMarkStatus,
}: VocabDetailPanelProps) {
 const [sectionView, setSectionView] = useState<SectionView>("all");
 if (!word) {
  return (
   <Card padding="lg" className="rounded-2xl -2xl">
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
 const visibleOrderedSections = orderedSections.filter(
  (section) => sectionView === "all" || section.key === sectionView,
 );
 const showExamples = sectionView === "all" || sectionView === "examples";
 const visibleTrailingSections = trailingSections.filter((section) => {
  if (sectionView === "all") return true;
  if (sectionView === "notes") return section.key === "notes";
  return section.key === sectionView;
 });
 const sectionTabs = [
  { key: "all" as const, label: "Tất cả" },
  { key: "meaning" as const, label: "Nghĩa" },
  { key: "etymology" as const, label: "Logic" },
  { key: "comparisons" as const, label: "So sánh" },
  { key: "examples" as const, label: "Ví dụ" },
  { key: "notes" as const, label: "Lưu ý" },
 ].filter((item) => {
  if (item.key === "all") return true;
  if (item.key === "examples") return word.examplesParsed.length > 0;
  if (item.key === "notes") return sectionByKey.has("notes");
  return sectionByKey.has(item.key);
 });

 return (
  <Card padding="lg" className="rounded-2xl -2xl">
   <article className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
       <h2 className="text-5xl font-black tracking-normal text-text-primary">
        {word.word}
       </h2>
       <Badge variant="accent">{status}</Badge>
       {word.level && <Badge>{word.level}</Badge>}
       {word.pos?.vi && <Badge variant="info">{word.pos.vi}</Badge>}
      </div>
      <p className="mt-2 text-lg font-black ">{word.pinyin}</p>
      <p className="text-sm font-bold text-text-secondary">
       {word.hanViet} · {word.meaning}
      </p>
     </div>
     <div className="flex flex-wrap gap-2">
      {editDraftId && editItemId && (
       <InlineDraftItemEditDialog
        kind="vocab"
        draftId={editDraftId}
        itemId={editItemId}
       />
      )}

      <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
       <Bookmark className="h-4 w-4" />
       {bookmarked ? "Đã lưu" : "Lưu"}
      </Button>
     </div>
    </div>

    <div className="flex flex-wrap gap-2">
     <Button
      variant={status === "known" ? "default" : "outline"}
      onClick={() => onMarkStatus("known")}
     >
      <CheckCircle2 className="h-4 w-4" />
      Đã biết
     </Button>
     <Button
      variant={status === "hard" ? "default" : "outline"}
      onClick={() => onMarkStatus("hard")}
     >
      <TriangleAlert className="h-4 w-4" />
      Còn khó
     </Button>
     <Button
      variant={status === "new" ? "default" : "outline"}
      onClick={() => onMarkStatus("new")}
     >
      <Circle className="h-4 w-4" />
      Học mới
     </Button>
    </div>

    <nav className="flex flex-wrap gap-2" aria-label="Điều hướng phần từ vựng">
     {sectionTabs.map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => setSectionView(item.key)}
       className={[
        "rounded-2xl -full border px-3 py-1 text-xs font-black transition-colors",
        sectionView === item.key
         ? "border-accent bg-accent text-white"
         : "border-border-default bg-bg-subtle text-text-muted hover:text-text-primary",
       ].join(" ")}
      >
       {item.label}
      </button>
     ))}
    </nav>

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

    {showExamples && word.examplesParsed.length > 0 && (
     <ReadingSection id="vocab-examples" title="Ví dụ">
      {word.examplesParsed.map((example) => (
       <div
        key={`${example.zh}-${example.vi}`}
        className="rounded-2xl border border-border-default bg-bg-card p-4"
       >
        <p className="text-base font-black leading-relaxed text-text-primary">
         {example.zh}
        </p>
        {example.pinyin && (
         <p className="mt-1 text-sm font-bold leading-relaxed  ">
          {example.pinyin}
         </p>
        )}
        {example.vi && (
         <p className="mt-1 text-sm font-semibold leading-relaxed text-text-secondary">
          {example.vi}
         </p>
        )}
        {example.note && (
         <p className="mt-2 border-t border-border-default pt-2 text-sm leading-relaxed text-text-muted">
          {example.note}
         </p>
        )}
       </div>
      ))}
     </ReadingSection>
    )}

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
   className="group rounded-2xl border border-border-default bg-bg-subtle p-4"
  >
   <summary className="cursor-pointer text-base font-black text-text-primary">
    {title}
   </summary>
   <div className="mt-3 grid gap-3 text-base leading-relaxed text-text-secondary">
    {children}
   </div>
  </details>
 );
}
