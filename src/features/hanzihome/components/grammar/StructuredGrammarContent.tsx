"use client";

import {
 HanziAwareText,
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { Lightbulb, Sigma } from "lucide-react";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import type { GrammarViewModel } from "@/features/hanzihome/types";
import { CreateNormalizedChildDialog } from "@/features/hanzihome/editing/components/CreateNormalizedChildDialog";
import { GrammarDetailSectionCard } from "./GrammarDetailSectionCard";
import { cleanGrammarDisplayLine, isDuplicateCoreSection } from "./grammar-display";

type StructuredGrammarContentProps = {
 point: GrammarViewModel;
 lessonId?: string;
 pointPath?: EditableNodePath;
 exampleLimit?: number;
 editMode?: boolean;
};

export function StructuredGrammarContent({
 point,
 lessonId,
 pointPath,
 exampleLimit,
 editMode = false,
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
   {editMode && lessonId && point.editMeta ? (
    <div className="flex justify-end">
     <CreateNormalizedChildDialog family="grammar" lessonId={lessonId} parent={point.editMeta} />
    </div>
   ) : null}
   {point.core && (
    <section className="grid gap-3 rounded-xl border border-primary/20 bg-primary/8 p-4 shadow-theme-sm">
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
    <section className="grid gap-3 rounded-xl border border-info/30 bg-info-subtle/45 p-4">
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
     {point.structuresView.map((structure, index) => (
      <HanziAwareText
       key={`${point.id}-structure-${index}`}
       text={cleanGrammarDisplayLine(structure)}
       variant="code"
       tone="info"
       weight="black"
       leading="relaxed"
       className="rounded-xl border border-info/40 bg-bg-primary px-4 py-3 shadow-theme-sm"
      />
     ))}
    </section>
   )}

   {detailSections.length > 0 && (
    <section className="grid gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Chi tiết
     </Typography>
     {detailSections.map((section, index) => {
      const content = <GrammarDetailSectionCard section={section} />;

      if (!lessonId || !pointPath || !section.id) {
       return <div key={section.id || section.key}>{content}</div>;
      }

      return (
       <EditableNodeWrapper
        key={section.id}
        lessonId={lessonId}
        entityType="grammar_detail_section"
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
     <Typography as="h3" variant="cardTitle" tone="default" weight="black">
      Ví dụ nhanh
     </Typography>
     {examples.map((example, index) => {
      const content = (
       <div className="rounded-xl border border-border-subtle bg-bg-subtle p-3 sm:p-4">
        <HanziText
         as="p"
         size="inherit"
         variant="sectionTitle"
         tone="default"
         weight="black"
         leading="relaxed"
        >
         {example.zh}
        </HanziText>
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
  </div>
 );
}
