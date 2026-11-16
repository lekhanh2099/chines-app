"use client";

import { CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { Link } from "@/i18n/navigation";

import type { LearningLoopItemRow, rateLearningLoopItem } from "./learning-loop-api";

import type { useLearningLoopRating } from "./useLearningLoopRating";

type LearningLoopRating = Parameters<typeof rateLearningLoopItem>[0]["rating"];

export function LearningLoopCompletionCard({ reviewedInSession }: { reviewedInSession: number }) {
 const t = useTranslations("LearningLoop");

 return (
  <Card variant="section" padding="lg" className="grid justify-items-center gap-4 text-center">
   <div className="flex size-16 items-center justify-center rounded-full bg-success-subtle text-success-text">
    <CheckCircle2 className="size-9 motion-safe:animate-pulse" />
   </div>
   <Typography as="h1" variant="pageTitle" weight="black">
    {t("completionTitle")}
   </Typography>
   <Typography as="p" variant="body" tone="muted">
    {t("completionDescription", { count: reviewedInSession })}
   </Typography>
   <div className="flex flex-wrap justify-center gap-2">
    <Button asChild>
     <Link href="/">{t("completionHome")}</Link>
    </Button>
   </div>
  </Card>
 );
}

export function LearningLoopEmptyCard({ onCheckAgain }: { onCheckAgain: () => void }) {
 const t = useTranslations("LearningLoop");

 return (
  <Card variant="section" padding="lg" className="grid gap-2">
   <Typography as="h1" variant="pageTitle" weight="black">
    {t("title")}
   </Typography>
   <Typography variant="body" tone="muted">
    {t("emptyTitle")}
   </Typography>
   <Typography variant="bodySmall" tone="muted">
    {t("emptyDescription")}
   </Typography>
   <Button type="button" variant="outline" className="justify-self-start" onClick={onCheckAgain}>
    <RotateCcw data-icon="inline-start" />
    {t("checkAgain")}
   </Button>
  </Card>
 );
}

export function LearningLoopReviewCard({
 item,
 dueCount,
 error,
 isRating,
 tts,
 onRate,
}: {
 item: LearningLoopItemRow;
 dueCount: number;
 error: ReturnType<typeof useLearningLoopRating>["error"];
 isRating: boolean;
 tts: ReturnType<typeof useSharedMandarinTts>;
 onRate: (rating: LearningLoopRating) => void;
}) {
 const t = useTranslations("LearningLoop");

 return (
  <Card variant="section" padding="lg" className="grid gap-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <div className="flex flex-wrap items-center gap-2">
      <Badge variant="purple">{t(`kinds.${item.kind}`)}</Badge>
      <Badge variant="default">{t("dueCount", { count: dueCount })}</Badge>
     </div>
     <Typography as="h2" variant="sectionTitle" weight="black" lang="zh-CN">
      {item.prompt_zh}
     </Typography>
     <Typography variant="bodySmall" tone="muted">
      {item.title_vi || item.meaning_vi}
     </Typography>
    </div>
    <Typography variant="caption" tone="muted">
     {t("correctStreak", { count: item.correct_streak })}
    </Typography>
   </div>
   {item.pinyin ? (
    <Typography variant="body" tone="accent">
     {item.pinyin}
    </Typography>
   ) : null}
   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     variant="outline"
     disabled={tts.isLoading}
     onClick={() => tts.speakSequence([item.prompt_zh])}
    >
     <Volume2 data-icon="inline-start" />
     {t("listen")}
    </Button>
    <Button
     type="button"
     variant="ghost"
     disabled={!tts.isSpeaking && !tts.isLoading}
     onClick={tts.stop}
    >
     {t("stop")}
    </Button>
   </div>
   {item.meaning_vi ? (
    <div className="grid gap-1 rounded-lg border border-border-default bg-bg-subtle px-3 py-2">
     <Typography variant="caption" tone="muted" weight="bold">
      {t("referenceMeaning")}
     </Typography>
     <Typography variant="bodySmall">{item.meaning_vi}</Typography>
    </div>
   ) : null}
   <Typography variant="caption" tone="muted">
    {t("ratingHint")}
   </Typography>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="destructive" disabled={isRating} onClick={() => onRate("again")}>
     <kbd className="rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-xs">[1]</kbd>
     {t("ratings.again")}
    </Button>
    <Button type="button" variant="outline" disabled={isRating} onClick={() => onRate("hard")}>
     <kbd className="rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-xs">[2]</kbd>
     {t("ratings.hard")}
    </Button>
    <Button type="button" disabled={isRating} onClick={() => onRate("good")}>
     <kbd className="rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-xs">[3]</kbd>
     {t("ratings.good")}
    </Button>
   </div>
   {error ? (
    <Typography variant="caption" tone="danger">
     {error}
    </Typography>
   ) : null}
  </Card>
 );
}
