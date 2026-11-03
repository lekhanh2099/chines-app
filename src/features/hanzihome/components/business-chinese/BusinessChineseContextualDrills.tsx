"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Input } from "@/components/ui/forms/input";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import {
 type ContextualVocabDrillItem,
 evaluateContextualVocabDrill,
} from "./business-chinese-study-utils";

export function BusinessChineseContextualDrills({
 drills,
}: {
 drills: readonly ContextualVocabDrillItem[];
}) {
 const t = useTranslations("BusinessChinese");
 const [drafts, setDrafts] = useState<ReadonlyMap<string, string>>(new Map());
 const [results, setResults] = useState<ReadonlyMap<string, boolean>>(new Map());

 const handleDraftChange = (drillId: string, value: string) => {
  setDrafts((prev) => new Map(prev).set(drillId, value));
  setResults((prev) => {
   if (!prev.has(drillId)) return prev;
   const next = new Map(prev);
   next.delete(drillId);
   return next;
  });
 };

 const handleCheck = (drill: ContextualVocabDrillItem) => {
  const currentDraft = drafts.get(drill.id) ?? "";
  const isCorrect = evaluateContextualVocabDrill(currentDraft, drill.targetWord);
  setResults((prev) => new Map(prev).set(drill.id, isCorrect));
 };

 const handleReset = (drillId: string) => {
  setDrafts((prev) => {
   const next = new Map(prev);
   next.delete(drillId);
   return next;
  });
  setResults((prev) => {
   const next = new Map(prev);
   next.delete(drillId);
   return next;
  });
 };

 if (drills.length === 0) {
  return (
   <Card variant="subtle" padding="md">
    <Typography variant="body" tone="secondary">
     {t("vocabReview.clozeDescription")}
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-4">
   <div className="grid min-w-0 gap-1">
    <Typography as="h3" variant="sectionTitle" weight="bold">
     {t("vocabReview.clozeTitle")}
    </Typography>
    <Typography variant="bodySmall" tone="secondary">
     {t("vocabReview.clozeDescription")}
    </Typography>
   </div>

   <div className="grid min-w-0 gap-4">
    {drills.map((drill, index) => {
     const draft = drafts.get(drill.id) ?? "";
     const result = results.get(drill.id);

     return (
      <Card
       key={drill.id}
       id={drill.id}
       data-textbook-block={drill.id}
       variant="default"
       padding="md"
       className="scroll-mt-24"
      >
       <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="default" size="sm" casing="natural">
           {`#${index + 1}`}
          </Badge>
          <Badge variant="accent" size="md" casing="natural">
           {t("vocabReview.keywordHint", {
            pinyin: drill.targetPinyin,
            meaning: drill.targetMeaning,
           })}
          </Badge>
         </div>
         <MandarinSpeakButton
          text={drill.fullSentence}
          segments={[drill.fullSentence]}
          touchTarget
         />
        </div>

        <div className="grid min-w-0 gap-1.5 rounded-xl border border-border-default/50 bg-surface-muted/30 p-3.5">
         <Typography variant="body" weight="semibold">
          {drill.displayPrompt}
         </Typography>
         {drill.sentenceTranslation ? (
          <Typography variant="bodySmall" tone="secondary">
           {drill.sentenceTranslation}
          </Typography>
         ) : null}
        </div>

        <div className="grid min-w-0 gap-2">
         <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Input
           density="compact"
           surface="card"
           className="min-w-0 flex-1"
           value={draft}
           onChange={(event) => handleDraftChange(drill.id, event.target.value)}
           onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing && draft.trim()) {
             event.preventDefault();
             handleCheck(drill);
            }
           }}
           placeholder={t("vocabReview.inputPlaceholder")}
           aria-label={t("vocabReview.inputPlaceholder")}
          />
          <Button type="button" size="compact" variant="outline" onClick={() => handleCheck(drill)}>
           {t("vocabReview.checkAnswer")}
          </Button>
          <Button
           type="button"
           size="compact"
           variant="ghost"
           onClick={() => handleReset(drill.id)}
          >
           {t("vocabReview.resetAnswer")}
          </Button>
         </div>

         {result !== undefined ? (
          <Badge variant={result ? "success" : "warning"} size="md" casing="natural" role="status">
           {result
            ? t("vocabReview.feedback.correct")
            : t("vocabReview.feedback.incorrect", { answer: drill.targetWord })}
          </Badge>
         ) : null}
        </div>
       </div>
      </Card>
     );
    })}
   </div>
  </div>
 );
}
