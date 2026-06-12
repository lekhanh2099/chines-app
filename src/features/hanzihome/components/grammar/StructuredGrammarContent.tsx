"use client";

import { Lightbulb, Sigma } from "lucide-react";
import { EditableNodeWrapper, type DraftPatchPath } from "@/features/hanzihome/editing";
import type { GrammarViewModel } from "@/features/hanzihome/types";
import { GrammarDetailSectionCard } from "./GrammarDetailSectionCard";
import { cleanGrammarDisplayLine, isDuplicateCoreSection } from "./grammar-display";

type StructuredGrammarContentProps = {
 point: GrammarViewModel;
 lessonId?: string;
 pointPath?: DraftPatchPath;
 exampleLimit?: number;
};

export function StructuredGrammarContent({
 point,
 lessonId,
 pointPath,
 exampleLimit,
}: StructuredGrammarContentProps) {
 const hasExampleDetailSection = Boolean(
  point.detailSections?.some((section) =>
   section.title.toLocaleLowerCase("vi-VN").includes("ví dụ"),
  ),
 );
 const detailSections = (point.detailSections ?? []).filter(
  (section) => section.lines.length > 0 && !isDuplicateCoreSection(section, point.core),
 );
 const examples =
  typeof exampleLimit === "number"
   ? point.examplesParsed.slice(0, exampleLimit)
   : point.examplesParsed;

 return (
  <div className="grid gap-4">
   {point.core && (
    <section className="rounded-xl border border-primary/20 bg-primary/8 p-4 shadow-theme-sm">
     <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-primary text-primary">
       <Lightbulb className="h-4 w-4" />
      </span>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Ý nghĩa cần nhớ</p>
     </div>
     <p className="mt-3 text-base font-bold leading-relaxed text-text-primary sm:text-lg">
      {cleanGrammarDisplayLine(point.core)}
     </p>
    </section>
   )}

   {point.structuresView.length > 0 && (
    <section className="grid gap-3 rounded-xl border border-info/30 bg-info-subtle/45 p-4">
     <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-primary text-info-text">
       <Sigma className="h-4 w-4" />
      </span>
      <div>
       <p className="text-xs font-black uppercase tracking-[0.18em] text-info-text">Công thức</p>
       <h3 className="text-base font-black text-text-primary">Mẫu cần nhớ</h3>
      </div>
     </div>
     {point.structuresView.map((structure) => (
      <p
       key={structure}
       className="rounded-xl border border-info/40 bg-bg-primary px-4 py-3 font-mono text-base font-black leading-relaxed text-info-text shadow-theme-sm sm:text-lg"
      >
       {cleanGrammarDisplayLine(structure)}
      </p>
     ))}
    </section>
   )}

   {detailSections.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Chi tiết</h3>
     {detailSections.map((section, index) => {
      const content = <GrammarDetailSectionCard section={section} />;

      if (!lessonId || !pointPath || !section.id) {
       return <div key={section.id || section.key}>{content}</div>;
      }

      return (
       <EditableNodeWrapper
        key={section.id}
        lessonId={lessonId}
        entityType="grammar_block"
        entityId={section.id}
        parentEntityType="grammar_point"
        parentEntityId={point.id}
        path={[...pointPath, "detailSections", index]}
        value={section}
        label={section.title}
       >
        {content}
       </EditableNodeWrapper>
      );
     })}
    </section>
   )}

   {!hasExampleDetailSection && examples.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Ví dụ nhanh</h3>
     {examples.map((example, index) => {
      const content = (
       <div className="rounded-xl border border-border-subtle bg-bg-subtle p-3 sm:p-4">
        <p className="text-lg font-black leading-relaxed text-text-primary">{example.zh}</p>
        {example.pinyin && (
         <p className="text-xs font-semibold leading-relaxed text-info-text">{example.pinyin}</p>
        )}
        {example.vi && (
         <p className="font-semibold leading-relaxed text-text-secondary">{example.vi}</p>
        )}
       </div>
      );

      if (!lessonId || !pointPath || !example.id) {
       return <div key={example.id || index}>{content}</div>;
      }

      return (
       <EditableNodeWrapper
        key={example.id}
        lessonId={lessonId}
        entityType="grammar_example"
        entityId={example.id}
        parentEntityType="grammar_point"
        parentEntityId={point.id}
        path={[...pointPath, "examplesParsed", index]}
        value={example}
        label={example.zh}
       >
        {content}
       </EditableNodeWrapper>
      );
     })}
    </section>
   )}

   {point.notes.length > 0 && (
    <section className="grid gap-2">
     <h3 className="text-base font-black text-text-primary">Lưu ý / bẫy sai</h3>
     {point.notes.map((note) => (
      <p key={note} className="leading-relaxed text-text-secondary">
       {note}
      </p>
     ))}
    </section>
   )}
  </div>
 );
}
