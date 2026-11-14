"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { Typography } from "@/components/ui/display/typography";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { buildReaderSourceHref } from "@/features/reading/model/reading-source-target";

/** Shadowing delay slider plus the "mark difficult" review action for one paragraph. */
export function ShadowingDelayControls({
 paragraph,
 delayMs,
 disabled,
 onDelayChange,
}: {
 paragraph: ReaderDocumentResource["paragraphs"][number];
 delayMs: number;
 disabled: boolean;
 onDelayChange: (delayMs: number) => void;
}) {
 const t = useTranslations("Reader.study.shadowing");

 return (
  <Card
   variant="subtle"
   padding="sm"
   className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
  >
   <label className="grid gap-1">
    <Typography as="span" variant="caption" tone="muted" weight="bold">
     {t("delay", { delay: delayMs })}
    </Typography>
    <Input
     type="range"
     min={0}
     max={1500}
     step={250}
     value={delayMs}
     disabled={disabled}
     onChange={(event) => onDelayChange(Number(event.target.value))}
     aria-label={t("delayAria")}
    />
   </label>
   <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => {
     void savePracticeAttempt({
      surface: "shadowing",
      contentId: paragraph.id,
      direction: "review",
      answer: { expectedText: paragraph.zh, pinyin: paragraph.pinyin },
      scorePercent: null,
      responseMs: null,
     }).catch(() => undefined);
     const now = new Date().toISOString();
     void upsertLearningLoopItem({
      id: `shadowing:${paragraph.id}`,
      stable_key: `shadowing:${paragraph.id}`,
      kind: "shadowing",
      source_id: paragraph.id,
      source_href: buildReaderSourceHref({
       source: "shadowing",
       documentId: paragraph.document_id,
       paragraphId: paragraph.id,
      }),
      title_zh: "Shadowing",
      title_vi: "Ôn nói theo mẫu",
      prompt_zh: paragraph.zh,
      pinyin: paragraph.pinyin,
      meaning_vi: "",
      user_answer: "",
      error_key: "marked-difficult",
      state: "new",
      due_at: now,
      interval_days: 0,
      correct_streak: 0,
      lapse_count: 0,
      revision: 0,
     }).catch(() => undefined);
    }}
   >
    <Star data-icon="inline-start" />
    {t("markDifficult")}
   </Button>
  </Card>
 );
}
