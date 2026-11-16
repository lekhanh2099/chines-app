"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziAwareText,
 HanziText,
 PinyinText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import { CharacterNoteHint } from "@/features/hanzihome/radical-characters/CharacterNoteHint";

import type { SpeakingDrillSelection } from "./speaking-drills.types";

export function SpeakingDrillMaterials({ lesson }: { lesson: SpeakingDrillSelection["lesson"] }) {
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
    <ul className="grid gap-x-6 sm:grid-cols-2 2xl:grid-cols-1">
     {lesson.vocab.map((item) => (
      <li
       key={`${item.hanzi}:${item.pinyin}`}
       className="flex min-w-0 items-center gap-3 border-b border-border-default py-2"
      >
       <div className="grid min-w-0 flex-1 gap-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
         <HanziText as="span" size="large">
          {item.hanzi}
         </HanziText>
         {item.pinyin ? <PinyinText>{item.pinyin}</PinyinText> : null}
        </div>
        <TranslationText>{item.vi}</TranslationText>
       </div>
       <CharacterNoteHint text={item.hanzi} />
       <MandarinSpeakButton text={item.hanzi} />
      </li>
     ))}
    </ul>
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
          {pattern.examples.map((example) => (
           <li key={example.zh}>
            <Card variant="subtle" padding="sm" className="flex min-w-0 items-start gap-2">
             <div className="grid min-w-0 flex-1 gap-0.5">
              <HanziText as="p" size="medium">
               {example.zh}
              </HanziText>
              {example.pinyin ? <PinyinText as="p">{example.pinyin}</PinyinText> : null}
              {example.vi ? <TranslationText>{example.vi}</TranslationText> : null}
             </div>
             <MandarinSpeakButton text={example.zh} />
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
