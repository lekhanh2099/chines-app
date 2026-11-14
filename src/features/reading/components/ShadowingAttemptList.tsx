"use client";

import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";

export type ShadowingAttempt = {
 confirmed: boolean;
 durationSeconds: number;
 id: string;
 isSaving: boolean;
 saveError: string | null;
 transcript: string;
 url: string;
};

/** Session recordings with their transcript editors and save actions. */
export function ShadowingAttemptList({
 attempts,
 onTranscriptChange,
 onConfirm,
}: {
 attempts: ShadowingAttempt[];
 onTranscriptChange: (attemptId: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
 onConfirm: (attempt: ShadowingAttempt) => void;
}) {
 const t = useTranslations("Reader.study.shadowing");

 return (
  <Card variant="subtle" padding="sm" className="grid gap-2">
   <Typography as="h4" variant="caption" weight="black">
    {t("sessionRecordings")}
   </Typography>
   {attempts.map((attempt, index) => (
    <Card key={attempt.id} variant="default" padding="sm" className="grid gap-2">
     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Typography variant="caption" tone="muted">
       {t("attempt", { number: attempts.length - index, seconds: attempt.durationSeconds })}
      </Typography>
      <audio
       controls
       preload="metadata"
       src={attempt.url}
       className="min-w-0 flex-1"
       aria-label={t("audioAria")}
      />
     </div>
     <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label className="grid gap-1">
       <Typography as="span" variant="caption" tone="muted" weight="bold">
        {t("transcriptLabel")}
       </Typography>
       <Textarea
        value={attempt.transcript}
        disabled={attempt.confirmed || attempt.isSaving}
        onChange={(event) => onTranscriptChange(attempt.id, event)}
        placeholder={t("transcriptPlaceholder")}
        rows={2}
       />
      </label>
      <Button
       type="button"
       size="sm"
       disabled={!attempt.transcript.trim() || attempt.confirmed || attempt.isSaving}
       onClick={() => onConfirm(attempt)}
      >
       {attempt.confirmed ? t("saved") : attempt.isSaving ? t("saving") : t("saveAttempt")}
      </Button>
     </div>
     {attempt.saveError ? (
      <Typography variant="caption" tone="danger">
       {attempt.saveError}
      </Typography>
     ) : null}
    </Card>
   ))}
  </Card>
 );
}
