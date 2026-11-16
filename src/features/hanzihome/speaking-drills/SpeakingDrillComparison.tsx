"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 PinyinText,
 StudyInstructionText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";

import type { SpeakingDrillLine, SpeakingDrillTopic } from "./speaking-drills.schemas";

export function SpeakingDrillComparison({ topic }: { topic: SpeakingDrillTopic }) {
 const t = useTranslations("SpeakingDrills");
 const v1ByNumber = new Map(topic.v1Lines.map((line) => [line.n, line]));
 const v2ByNumber = new Map(topic.v2Lines.map((line) => [line.n, line]));

 if (topic.changes.length === 0) {
  return (
   <Card variant="subtle" padding="md">
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("noChanges")}
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid gap-3">
   <Typography as="p" variant="label" tone="secondary">
    {t("changesSummary", { count: topic.changes.length })}
   </Typography>
   {topic.changes.map((change) => {
    const original = v1ByNumber.get(change.n);
    const optimized = v2ByNumber.get(change.n);
    return (
     <Card key={change.n} variant="default" padding="md" className="grid gap-3">
      <Typography as="h3" variant="label">
       {t("lineNumber", { number: Number(change.n) })}
       {optimized ? ` · ${optimized.role}` : ""}
      </Typography>
      <div className="grid gap-2 md:grid-cols-2">
       {original ? (
        <ComparisonLine label={t("versionOriginal")} line={original} accent={false} />
       ) : null}
       {optimized ? <ComparisonLine label={t("versionOptimized")} line={optimized} accent /> : null}
      </div>
      <StudyInstructionText variant="bodySmall" tone="secondary">
       <Typography as="span" variant="label" tone="success">
        {t("reason")}:{" "}
       </Typography>
       {change.reason}
      </StudyInstructionText>
     </Card>
    );
   })}
  </div>
 );
}

function ComparisonLine({
 label,
 line,
 accent,
}: {
 label: string;
 line: SpeakingDrillLine;
 accent: boolean;
}) {
 return (
  <Card variant="subtle" padding="sm" className="grid gap-1">
   <div className="flex items-center justify-between gap-2">
    <Typography as="span" variant="overline" tone={accent ? "accent" : "muted"}>
     {label}
    </Typography>
    <MandarinSpeakButton text={line.zh} />
   </div>
   <HanziText as="p" size="medium">
    {line.zh}
   </HanziText>
   {line.pinyin ? <PinyinText as="p">{line.pinyin}</PinyinText> : null}
   {line.vi ? <TranslationText>{line.vi}</TranslationText> : null}
  </Card>
 );
}
