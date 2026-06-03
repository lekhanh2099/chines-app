"use client";

import { Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import type {
 GrammarViewModel,
 HanziHomeVocabItem,
 LearningStatus,
} from "@/features/hanzihome/types";
import {
 getVocabDisplayMeaning,
 getVocabItemKey,
} from "@/features/hanzihome/utils/vocab-item";

type GrammarPointReaderProps = {
 point: GrammarViewModel | null;
 status: LearningStatus;
 bookmarked: boolean;
 relatedVocab: HanziHomeVocabItem[];
 lessonId?: string;
 onBookmark: () => void;
 onMarkStatus: (status: LearningStatus) => void;
};

export function GrammarPointReader({
 point,
 status,
 bookmarked,
 relatedVocab,
 onBookmark,
}: GrammarPointReaderProps) {
 if (!point) {
  return (
   <Card padding="lg" className="rounded-xl">
    <p className="text-sm font-semibold text-text-muted">
     Bài này chưa có điểm ngữ pháp.
    </p>
   </Card>
  );
 }

 const contentMd = point.contentMd?.trim();
 const hasStructuredContent =
  point.structuresView.length > 0 ||
  point.examplesParsed.length > 0 ||
  Boolean(point.detailSections?.length) ||
  point.notes.length > 0;

 return (
  <Card padding="lg" className="rounded-xl">
   <article className="flex flex-col gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      <Badge variant="info">{status}</Badge>
      <h2 className="text-2xl font-black tracking-normal text-text-primary">
       {point.cleanTitle}
      </h2>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button variant={bookmarked ? "default" : "outline"} onClick={onBookmark}>
       <Bookmark className="h-4 w-4" />
       {bookmarked ? "Đã lưu" : "Lưu"}
      </Button>
     </div>
    </div>

    {hasStructuredContent ? (
     <StructuredGrammarContent point={point} />
    ) : contentMd ? (
     <MarkdownContent content={contentMd} />
    ) : null}

    {relatedVocab.length > 0 && (
     <section className="grid gap-2">
      <h3 className="text-base font-black text-text-primary">
       Từ vựng liên quan trong bài
      </h3>
      <div className="flex flex-wrap gap-2">
       {relatedVocab.map((word) => (
        <Badge key={getVocabItemKey(word)} variant="accent" size="lg">
         {word.hanzi} · {getVocabDisplayMeaning(word)}
        </Badge>
       ))}
      </div>
     </section>
    )}
   </article>
  </Card>
 );
}

export function StructuredGrammarContent({
 point,
 exampleLimit,
}: {
 point: GrammarViewModel;
 exampleLimit?: number;
}) {
 const hasExampleDetailSection = Boolean(
  point.detailSections?.some((section) =>
   section.title.toLocaleLowerCase("vi-VN").includes("ví dụ"),
  ),
 );
 const detailSections = (point.detailSections ?? []).filter(
  (section) =>
   section.lines.length > 0 && !isDuplicateCoreSection(section, point.core),
 );
 const examples =
  typeof exampleLimit === "number"
   ? point.examplesParsed.slice(0, exampleLimit)
   : point.examplesParsed;

 return (
  <div className="grid gap-4">
   {point.core && (
    <section className="rounded-2xl border border-accent/25 bg-accent-subtle/60 p-4 shadow-theme-sm">
     <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-text">
      Ý nghĩa cốt lõi
     </p>
     <p className="mt-2 text-base font-bold leading-relaxed text-text-primary">
      {point.core}
     </p>
    </section>
   )}

   {point.structuresView.length > 0 && (
    <section className="grid gap-2 rounded-2xl border border-info/30 bg-info-subtle/45 p-4">
     <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-info-text">
       Công thức
      </p>
      <h3 className="text-lg font-black text-text-primary">
       Mẫu cần nhớ
      </h3>
     </div>
     {point.structuresView.map((structure) => (
      <p
       key={structure}
       className="rounded-xl border border-info/40 bg-bg-primary px-4 py-3 font-mono text-base font-black leading-relaxed text-info-text shadow-theme-sm"
      >
       {structure}
      </p>
     ))}
    </section>
   )}

   {detailSections.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Chi tiết</h3>
     {detailSections.map((section) => (
      <GrammarDetailSectionCard key={section.key} section={section} />
     ))}
    </section>
   )}

   {!hasExampleDetailSection && examples.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Ví dụ nhanh</h3>
     {examples.map((example) => (
      <div
       key={`${example.zh}-${example.vi}`}
       className="rounded-xl border border-border-subtle bg-bg-subtle p-3"
      >
       <p className="text-base font-black leading-relaxed text-text-primary">
        {example.zh}
       </p>
       {example.pinyin && (
        <p className="text-xs font-semibold leading-relaxed text-info-text">
         {example.pinyin}
        </p>
       )}
       {example.vi && (
        <p className="text-sm font-semibold leading-relaxed text-text-secondary">
         {example.vi}
        </p>
       )}
      </div>
     ))}
    </section>
   )}

   {point.notes.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Lưu ý / bẫy sai</h3>
     {point.notes.map((note) => (
      <p key={note} className="text-sm leading-relaxed text-text-secondary">
       {note}
      </p>
     ))}
    </section>
   )}
  </div>
 );
}

type GrammarDetailSection = NonNullable<
 GrammarViewModel["detailSections"]
>[number];

function GrammarDetailSectionCard({
 section,
}: {
 section: GrammarDetailSection;
}) {
 const importantLines = section.lines.filter(isImportantGrammarLine);
 const bodyLines = section.lines.filter((line) => !isImportantGrammarLine(line));

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3">
   <h4 className="text-sm font-black text-text-primary">{section.title}</h4>

   {importantLines.length > 0 && (
    <div className="grid gap-2">
     {importantLines.map((line) => {
      const parts = splitImportantGrammarLine(line);

      return (
       <div
        key={line}
        className="rounded-xl border border-info/30 bg-bg-primary px-3 py-2 shadow-theme-sm"
       >
        {parts.label && (
         <p className="text-xs font-black uppercase tracking-[0.16em] text-info-text">
          {parts.label}
         </p>
        )}
        <p className="mt-1 font-mono text-sm font-black leading-relaxed text-text-primary">
         {parts.value}
        </p>
       </div>
      );
     })}
    </div>
   )}

   {bodyLines.length > 0 && (
    <MarkdownContent content={bodyLines.join("\n")} className="gap-2" />
   )}
  </div>
 );
}

function normalizeGrammarText(value: string) {
 return value
  .replace(/[#*_`>-]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase("vi-VN");
}

function isDuplicateCoreSection(section: GrammarDetailSection, core: string) {
 const normalizedCore = normalizeGrammarText(core);
 if (!normalizedCore) return false;

 const normalizedSection = normalizeGrammarText(section.lines.join(" "));
 if (normalizedSection === normalizedCore) return true;

 const normalizedTitle = normalizeGrammarText(section.title);
 return (
  normalizedTitle.includes("bản chất") &&
  normalizedSection.includes(normalizedCore) &&
  normalizedSection.length <= normalizedCore.length + 32
 );
}

function isImportantGrammarLine(line: string) {
 return /^(cấu trúc|công thức|pattern|mẫu câu|句型|结构|格式)\s*[:：]/i.test(
  line.trim(),
 );
}

function splitImportantGrammarLine(line: string) {
 const match = /^([^:：]{1,32})[:：]\s*(.+)$/.exec(line.trim());

 return {
  label: match?.[1]?.trim(),
  value: match?.[2]?.trim() || line.trim(),
 };
}
