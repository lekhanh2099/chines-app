"use client";

import {
 HanziAwareText,
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Card } from "@/components/ui/layout/card";
import { Lightbulb, Sigma } from "lucide-react";
import type { GrammarViewModel } from "@/features/hanzihome/types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import { GrammarDetailSectionCard } from "./GrammarDetailSectionCard";
import { cleanGrammarDisplayLine, isDuplicateCoreSection } from "./grammar-display";

type StructuredGrammarContentProps = {
 point: GrammarViewModel;
 exampleLimit?: number;
};

export function StructuredGrammarContent({ point, exampleLimit }: StructuredGrammarContentProps) {
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
    <section className="grid gap-3 rounded-xl border border-primary/20 bg-primary/8 p-4">
     <div className="flex items-center gap-2">
      <StudyInstructionText
       as="span"
       tone="primary"
       className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-primary"
      >
       <Lightbulb className="h-4 w-4" />
      </StudyInstructionText>
      <StudyInstructionText
       variant="overline"
       tone="primary"
       weight="black"
       tracking="extraLoose"
       transform="uppercase"
      >
       Ý nghĩa cần nhớ
      </StudyInstructionText>
     </div>
     <HanziAwareText
      text={cleanGrammarDisplayLine(point.core)}
      tone="default"
      weight="bold"
      leading="relaxed"
     />
    </section>
   )}

   {point.structuresView.length > 0 && (
    <section className="grid gap-3 border-t border-border-default pt-4">
     <div className="flex items-center gap-2">
      <StudyInstructionText
       as="span"
       tone="info"
       className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-primary"
      >
       <Sigma className="h-4 w-4" />
      </StudyInstructionText>
      <div>
       <StudyInstructionText
        variant="overline"
        tone="info"
        weight="black"
        tracking="extraLoose"
        transform="uppercase"
       >
        Công thức
       </StudyInstructionText>
       <Typography as="h3" variant="cardTitle" tone="default" weight="black">
        Mẫu cần nhớ
       </Typography>
      </div>
     </div>
     <div className="grid gap-2">
      {point.structuresView.map((structure, index) => (
       <HanziAwareText
        key={`${point.id}-structure-${index}`}
        text={cleanGrammarDisplayLine(structure)}
        variant="code"
        tone="info"
        weight="black"
        leading="relaxed"
        className="rounded-lg bg-info-subtle/45 px-3 py-2"
       />
      ))}
     </div>
    </section>
   )}

   {!hasExampleDetailSection && examples.length > 0 && (
    <section className="grid gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Ví dụ nhanh
     </Typography>
     {examples.map((example, index) => (
      <div
       key={example.id || index}
       className="rounded-xl border border-border-subtle bg-bg-subtle p-3 sm:p-4"
      >
       <div className="flex min-w-0 items-start gap-2">
        <HanziText
         as="p"
         size="inherit"
         variant="sectionTitle"
         tone="default"
         weight="black"
         leading="relaxed"
         className="min-w-0 flex-1"
        >
         {example.zh}
        </HanziText>
        <MandarinSpeakButton text={example.zh} touchTarget />
       </div>
       {example.pinyin && (
        <StudyInstructionText variant="caption" tone="info" weight="semibold" leading="relaxed">
         {example.pinyin}
        </StudyInstructionText>
       )}
       {example.vi && (
        <StudyInstructionText tone="secondary" weight="semibold" leading="relaxed">
         {example.vi}
        </StudyInstructionText>
       )}
      </div>
     ))}
    </section>
   )}

   {point.notes.length > 0 && (
    <section className="grid gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Lưu ý / bẫy sai
     </Typography>
     {point.notes.map((note, index) => (
      <HanziAwareText
       key={`${point.id}-note-${index}`}
       text={note}
       tone="secondary"
       leading="relaxed"
      />
     ))}
    </section>
   )}

   {detailSections.length > 0 && (
    <section className="grid gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Chi tiết
     </Typography>
     {detailSections.map((section) => {
      const isReferenceSection =
       section.key === "source" || section.key === "verification" || section.key === "categories";
      return isReferenceSection ? (
       <Card key={section.id || section.key} asChild variant="subtle" padding="sm">
        <details className="grid gap-2">
         <summary className={`min-h-11 cursor-pointer rounded-lg py-3 ${focusRingClassName}`}>
          <HanziAwareText
           as="span"
           text={cleanGrammarDisplayLine(section.title)}
           variant="cardTitle"
           tone="default"
           weight="black"
          />
         </summary>
         <MarkdownContent content={section.lines.map(cleanGrammarDisplayLine).join("\n")} />
        </details>
       </Card>
      ) : (
       <GrammarDetailSectionCard key={section.id || section.key} section={section} />
      );
     })}
    </section>
   )}
  </div>
 );
}
