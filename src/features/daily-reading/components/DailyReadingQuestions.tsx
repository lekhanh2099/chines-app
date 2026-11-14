"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Typography } from "@/components/ui/display/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { DailyReading } from "@/features/daily-reading/model/daily-reading.schemas";

export function DailyReadingQuestions({ reading }: { reading: DailyReading }) {
 const t = useTranslations("DailyReading");
 const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
 if (reading.enrichment.questions.status !== "ready") return null;
 return (
  <div className="grid gap-3">
   {reading.enrichment.questions.data.items.map((question, index) => {
    const isRevealed = revealed.has(question.id);
    return (
     <Card key={question.id} variant="section" padding="md" className="grid gap-3">
      <div className="flex items-start gap-3">
       <Badge variant="info" size="sm">
        {index + 1}
       </Badge>
       <div className="grid min-w-0 gap-1">
        <HanziText as="p" size="medium">
         {question.promptZh}
        </HanziText>
        <Typography variant="bodySmall" tone="muted">
         {question.promptVi}
        </Typography>
       </div>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       className="justify-self-start"
       onClick={() =>
        setRevealed((current) => {
         const next = new Set(current);
         if (next.has(question.id)) next.delete(question.id);
         else next.add(question.id);
         return next;
        })
       }
      >
       {isRevealed ? t("generated.questions.hideAnswer") : t("generated.questions.showAnswer")}
      </Button>
      {isRevealed ? (
       <>
        <Separator />
        <div className="grid gap-1">
         <HanziText as="p" size="medium">
          {question.answerZh}
         </HanziText>
         <Typography variant="bodySmall" tone="secondary">
          {question.answerVi}
         </Typography>
        </div>
       </>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}
