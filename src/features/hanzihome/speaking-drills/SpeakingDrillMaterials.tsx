"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { SpeakableBusinessChineseText } from "@/features/hanzihome/components/business-chinese/BusinessChineseText";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import { VocabularyCardGrid } from "@/features/hanzihome/components/lesson-overview/overview/VocabularyCardList";

import type { SpeakingDrillSelection } from "./speaking-drills.types";

/** Lesson vocabulary (shared vocabulary cards with the app's pinyin), patterns, expressions and notes. */
export function SpeakingDrillMaterials({
 lesson,
 displayMode,
}: {
 lesson: SpeakingDrillSelection["lesson"];
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("SpeakingDrills");

 return (
  <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:items-start">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex items-baseline justify-between gap-2">
     <Typography as="h2" variant="cardTitle">
      {t("vocab")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted">
      {t("vocabCount", { count: lesson.vocab.length })}
     </Typography>
    </div>
    <VocabularyCardGrid>
     {lesson.vocab.map((item, index) => (
      <VocabPreviewRow
       key={`${item.hanzi}:${item.pinyin}`}
       hanzi={item.hanzi}
       pinyin={item.pinyin}
       hanviet=""
       category=""
       meaning={displayMode.showMeaning ? item.vi : ""}
       rawMeaning={item.vi}
       header={
        <SpeakableBusinessChineseText
         pronunciationId={`speaking-drill-vocab-${lesson.id}-${index}`}
         text={item.hanzi}
         sourcePinyin={item.pinyin}
         displayMode={displayMode}
         variant="body"
        />
       }
      />
     ))}
    </VocabularyCardGrid>
   </Card>

   <div className="grid min-w-0 gap-3">
    {lesson.patterns.length > 0 ? (
     <Card variant="section" padding="md" className="grid gap-3">
      <Typography as="h2" variant="cardTitle">
       {t("patterns")}
      </Typography>
      {lesson.patterns.map((pattern, index) => (
       <section key={pattern.title} className="grid gap-2">
        {index > 0 ? <Separator /> : null}
        <HanziAwareText text={pattern.title} variant="label" tone="default" />
        {pattern.explanation ? (
         <HanziAwareText text={pattern.explanation} variant="bodySmall" tone="secondary" />
        ) : null}
        {pattern.examples.length > 0 ? (
         <ul className="grid gap-2">
          {pattern.examples.map((example, exampleIndex) => (
           <li key={example.zh}>
            <Card variant="subtle" padding="sm" className="grid min-w-0 gap-1">
             <SpeakableBusinessChineseText
              pronunciationId={`speaking-drill-pattern-${lesson.id}-${index}-${exampleIndex}`}
              text={example.zh}
              sourcePinyin={example.pinyin || undefined}
              displayMode={displayMode}
              variant="body"
             />
             {displayMode.showMeaning && example.vi ? (
              <TranslationText>{example.vi}</TranslationText>
             ) : null}
            </Card>
           </li>
          ))}
         </ul>
        ) : null}
       </section>
      ))}
     </Card>
    ) : null}

    {lesson.expressions.length > 0 || lesson.notes.length > 0 ? (
     <Card variant="section" padding="md" className="grid gap-3">
      {lesson.expressions.length > 0 ? (
       <section className="grid gap-2">
        <Typography as="h2" variant="cardTitle">
         {t("expressions")}
        </Typography>
        <ul className="grid list-disc gap-1 pl-5">
         {lesson.expressions.map((expression) => (
          <li key={expression}>
           <HanziAwareText text={expression} as="span" variant="bodySmall" tone="default" />
          </li>
         ))}
        </ul>
       </section>
      ) : null}
      {lesson.expressions.length > 0 && lesson.notes.length > 0 ? <Separator /> : null}
      {lesson.notes.length > 0 ? (
       <section className="grid gap-2">
        <Typography as="h2" variant="cardTitle">
         {t("notes")}
        </Typography>
        {lesson.notes.map((note) => (
         <HanziAwareText key={note} text={note} variant="bodySmall" tone="secondary" />
        ))}
       </section>
      ) : null}
     </Card>
    ) : null}
   </div>
  </div>
 );
}
