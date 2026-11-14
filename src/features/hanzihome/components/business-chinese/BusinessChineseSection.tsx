"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { scrollAppContentToElement } from "@/components/layout/scroll/app-scroll";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Separator } from "@/components/ui/layout/separator";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import {
 splitTrailingTranslation,
 stripLeadingEmoji,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { cn } from "@/lib/utils";
import { BusinessChineseExercise } from "./BusinessChineseExercise";
import { BusinessChineseTable } from "./BusinessChineseTable";
import { BusinessChineseText, SpeakableBusinessChineseText } from "./BusinessChineseText";
import { BusinessChineseTextBlock } from "./BusinessChineseTextBlock";
import {
 businessChineseVisibleBlocks,
 pairPracticeBlankAnswers,
 splitBusinessChineseGrammarExample,
 splitPipePhraseDrill,
} from "./business-chinese-study-utils";

export function BusinessChineseSection({
 section,
 displayMode,
 translations,
 canonicalVocabularyTableIds,
 vocabularyPreview,
 deferLayout = true,
}: {
 section: TextbookLesson["sections"][number];
 displayMode: LessonDisplayMode;
 translations: ReadonlyMap<string, string>;
 canonicalVocabularyTableIds: readonly string[];
 vocabularyPreview?: ReactNode;
 deferLayout?: boolean;
}) {
 const t = useTranslations("BusinessChinese");
 const visibleBlocks = businessChineseVisibleBlocks(section, canonicalVocabularyTableIds);
 const sectionDisplayMode: LessonDisplayMode =
  section.category === "vocab" ? { ...displayMode, revealMode: "always" } : displayMode;
 const learnerContent = section.category === "grammar" || section.category === "practice";
 const practiceSubheadings =
  section.category === "practice"
   ? visibleBlocks.filter((block) => block.type === "subheading")
   : [];
 const { pairedAnswers, consumedAnswerBlockIds } = pairPracticeBlankAnswers(
  section.category === "practice" ? visibleBlocks : [],
 );
 const numberedPracticeItem = /^(?:[（(]\d+[）)]|[①-⑳]|\d+[.．、])/u;
 const blockGroups: TextbookLesson["sections"][number]["blocks"][] = [];
 for (const block of visibleBlocks) {
  if (consumedAnswerBlockIds.has(block.id)) continue;
  const current = blockGroups.at(-1);
  const first = current?.[0];
  if (
   section.category === "practice" &&
   current &&
   first?.type === "paragraph" &&
   numberedPracticeItem.test(first.text.trim()) &&
   !first.text.includes("→") &&
   block.type === "paragraph" &&
   !block.image &&
   !block.text.includes("→") &&
   !numberedPracticeItem.test(block.text.trim())
  ) {
   current.push(block);
  } else {
   blockGroups.push([block]);
  }
 }

 return (
  <section
   id={section.id}
   className={cn("grid min-w-0 scroll-mt-3 gap-4", deferLayout && "content-auto")}
  >
   {visibleBlocks.length > 0 &&
   !(section.category === "grammar" && visibleBlocks[0]?.type === "subheading") ? (
    <header>
     <SpeakableBusinessChineseText
      pronunciationId={`${section.id}:title`}
      text={stripLeadingEmoji(section.title)}
      displayMode={displayMode}
      variant="sectionTitle"
      weight="black"
      compactHanzi
      learnerContent={learnerContent}
      speakable={section.category !== "practice"}
     />
    </header>
   ) : null}
   {practiceSubheadings.length > 1 ? (
    <div className="flex min-w-0 flex-wrap gap-2">
     {practiceSubheadings.map((sub) => (
      <Button
       key={sub.id}
       type="button"
       size="compact"
       variant="outline"
       wrap="normal"
       onClick={() =>
        scrollAppContentToElement(document.getElementById(sub.id), {
         behavior: "smooth",
         block: "start",
        })
       }
      >
       {sub.text}
      </Button>
     ))}
    </div>
   ) : null}
   <div className="grid min-w-0 gap-4">
    {vocabularyPreview}
    {blockGroups.map((blocks, groupIndex) => {
     const first = blocks[0];
     if (!first) return null;
     const previous = blockGroups[groupIndex - 1]?.[0];
     const grammarExample =
      section.category === "grammar" &&
      first.type === "paragraph" &&
      Boolean(
       splitBusinessChineseGrammarExample(splitTrailingTranslation(first.text).source).translation,
      );
     const previousGrammarExample =
      previous?.type === "paragraph" &&
      Boolean(
       splitBusinessChineseGrammarExample(splitTrailingTranslation(previous.text).source)
        .translation,
      );
     const content = blocks.map((block) => {
      if (block.image) {
       return (
        <figure key={block.id} id={block.id} className="grid min-w-0 gap-2">
         <Image
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          unoptimized
          className="h-auto max-w-full"
         />
         {block.text ? (
          <Typography as="figcaption" variant="bodySmall" tone="muted">
           {block.text}
          </Typography>
         ) : null}
        </figure>
       );
      }
      if (block.type === "table") {
       return (
        <BusinessChineseTable
         key={block.id}
         block={block}
         displayMode={displayMode}
         vocabularyCards={section.category === "vocab"}
         learnerContent={learnerContent}
        />
       );
      }
      if (block.type === "subheading") {
       return (
        <BusinessChineseTextBlock
         key={block.id}
         pronunciationId={block.id}
         text={block.text}
         translation={block.translation ?? translations.get(block.id)}
         displayMode={sectionDisplayMode}
         compactHanzi={section.category !== "text" && section.category !== "vocab"}
         variant={
          section.category === "vocab" || section.category === "grammar"
           ? "sectionTitle"
           : "cardTitle"
         }
         weight="black"
         grammar={section.category === "grammar"}
         practice={section.category === "practice"}
         speakable={section.category !== "practice"}
        />
       );
      }
      if (
       section.category === "practice" &&
       (block.text.includes("→") || pairedAnswers.has(block.id))
      ) {
       return (
        <BusinessChineseExercise
         key={block.id}
         block={block}
         displayMode={displayMode}
         pairedAnswer={pairedAnswers.get(block.id)}
        />
       );
      }
      const phrases = section.category === "practice" ? splitPipePhraseDrill(block.text) : [];
      if (phrases.length > 0) {
       return (
        <div
         key={block.id}
         id={block.id}
         data-textbook-block={block.id}
         className="grid min-w-0 scroll-mt-24 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
         {phrases.map((phrase, index) => (
          <div
           key={`${index}:${phrase}`}
           className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2"
          >
           <BusinessChineseText
            pronunciationId={`${block.id}:phrase:${index}`}
            text={phrase}
            displayMode={displayMode}
            learnerContent
            variant="body"
           />
           <MandarinSpeakButton text={phrase} segments={[phrase]} touchTarget />
          </div>
         ))}
        </div>
       );
      }
      return (
       <BusinessChineseTextBlock
        key={learnerContent ? `${block.id}:${sectionDisplayMode.revealMode}` : block.id}
        pronunciationId={block.id}
        text={block.text}
        translation={block.translation ?? translations.get(block.id)}
        displayMode={sectionDisplayMode}
        compactHanzi={section.category !== "text" && section.category !== "vocab"}
        variant={section.category === "vocab" || learnerContent ? "body" : "bodySmall"}
        weight={section.category === "grammar" ? "normal" : undefined}
        grammar={section.category === "grammar"}
        practice={section.category === "practice"}
       />
      );
     });
     return (
      <div key={first.id} className="grid min-w-0 gap-3">
       {section.category === "grammar" && first.text.trim().startsWith("Cách dùng:") ? (
        <Typography as="h3" variant="cardTitle" weight="semibold">
         {t("content.explanation")}
        </Typography>
       ) : null}
       {grammarExample && !previousGrammarExample && !previous?.text.trim().startsWith("Ví dụ") ? (
        <Typography as="h3" variant="cardTitle" weight="semibold">
         {t("content.examples")}
        </Typography>
       ) : null}
       {content}
       {grammarExample && groupIndex < blockGroups.length - 1 ? <Separator /> : null}
      </div>
     );
    })}
   </div>
  </section>
 );
}
