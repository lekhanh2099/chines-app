"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useClientSession } from "@/components/providers/QueryProvider";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { Link } from "@/i18n/navigation";

import {
 fetchLearningLoopItems,
 rateLearningLoopItem,
 type LearningLoopItemRow,
} from "./learning-loop-api";

export function LearningLoopWorkspace() {
 const t = useTranslations("LearningLoop");
 const tts = useSharedMandarinTts();
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const [error, setError] = useState<string | null>(null);
 const [reviewProgress, setReviewProgress] = useState({ userId, count: 0 });
 const reviewedInSession = reviewProgress.userId === userId ? reviewProgress.count : 0;
 const learningLoopKey = hanzihomeQueryKeys.learningLoopForUser(userId);
 const query = useQuery({
  queryKey: learningLoopKey,
  queryFn: fetchLearningLoopItems,
  enabled: isResolved && Boolean(userId),
  staleTime: 0,
 });
 const rateMutation = useMutation({
  networkMode: "always",
  mutationFn: async (input: Parameters<typeof rateLearningLoopItem>[0]) => {
   if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Không cập nhật được Learning Loop.");
   }
   return rateLearningLoopItem(input);
  },
  onMutate: async (input) => {
   setError(null);
   await queryClient.cancelQueries({ queryKey: learningLoopKey });
   const previous = queryClient.getQueryData<LearningLoopItemRow[]>(learningLoopKey) || [];
   const targetIndex = previous.findIndex((item) => item.id === input.itemId);
   const targetItem = previous[targetIndex];
   queryClient.setQueryData<LearningLoopItemRow[]>(
    learningLoopKey,
    previous.filter((item) => item.id !== input.itemId),
   );
   return { targetItem, targetIndex };
  },
  onSuccess: async () => {
   setError(null);
   await queryClient.invalidateQueries({ queryKey: learningLoopKey });
   setReviewProgress((current) => ({
    userId,
    count: current.userId === userId ? current.count + 1 : 1,
   }));
  },
  onError: (caught: Error, _variables, context) => {
   setError(caught.message);
   if (context?.targetItem) {
    queryClient.setQueryData<LearningLoopItemRow[]>(learningLoopKey, (current) => {
     if (!current) return [context.targetItem];
     if (current.some((item) => item.id === context.targetItem.id)) return current;
     const copy = [...current];
     const insertAt =
      typeof context.targetIndex === "number" &&
      context.targetIndex >= 0 &&
      context.targetIndex <= copy.length
       ? context.targetIndex
       : 0;
     copy.splice(insertAt, 0, context.targetItem);
     return copy;
    });
   }
  },
 });
 const item = useMemo(() => query.data?.[0] ?? null, [query.data]);
 const rateItem = rateMutation.mutate;
 const speakSequence = tts.speakSequence;
 const isTtsLoading = tts.isLoading;

 useEffect(() => {
  if (item === null || !isResolved || !userId || query.isError || rateMutation.isPending) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.target instanceof HTMLElement &&
     event.target.closest(
      "a, button, input, textarea, select, [contenteditable='true'], [role='button'], [role='combobox'], [role='menuitem'], [role='option'], [role='tab']",
     ))
   )
    return;

   if (event.code === "Space" || event.key === " ") {
    if (isTtsLoading) return;
    event.preventDefault();
    speakSequence([item.prompt_zh]);
    return;
   }

   if (event.key === "1") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "again", expectedRevision: item.revision });
   } else if (event.key === "2") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "hard", expectedRevision: item.revision });
   } else if (event.key === "3") {
    event.preventDefault();
    rateItem({ itemId: item.id, rating: "good", expectedRevision: item.revision });
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  isResolved,
  isTtsLoading,
  item,
  query.isError,
  rateItem,
  rateMutation.isPending,
  speakSequence,
  userId,
 ]);

 if (!isResolved || query.isPending) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     {t("loading")}
    </Typography>
   </Card>
  );
 }
 if (!userId) {
  return (
   <Card variant="section" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     {t("emptyDescription")}
    </Typography>
   </Card>
  );
 }
 if (query.isError) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography variant="bodySmall" tone="danger">
     {t("loadError")}
    </Typography>
    <Button
     type="button"
     variant="outline"
     className="justify-self-start"
     onClick={() => void query.refetch()}
    >
     <RotateCcw data-icon="inline-start" />
     {t("checkAgain")}
    </Button>
   </Card>
  );
 }
 if (item === null) {
  if (rateMutation.isPending) {
   return (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      {t("finishing")}
     </Typography>
    </Card>
   );
  }

  if (reviewedInSession > 0) {
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
      <Button asChild variant="outline">
       <Link href="/dictionary">{t("completionDictionary")}</Link>
      </Button>
     </div>
    </Card>
   );
  }

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
    <Button
     type="button"
     variant="outline"
     className="justify-self-start"
     onClick={() => void query.refetch()}
    >
     <RotateCcw data-icon="inline-start" />
     {t("checkAgain")}
    </Button>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     {t("title")}
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     {t("description")}
    </Typography>
   </div>
   <Card variant="section" padding="lg" className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="purple">{t(`kinds.${item.kind}`)}</Badge>
       <Badge variant="default">{t("dueCount", { count: query.data.length })}</Badge>
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
     <Button
      type="button"
      variant="destructive"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({
        itemId: item.id,
        rating: "again",
        expectedRevision: item.revision,
       })
      }
     >
      <kbd className="rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-xs">[1]</kbd>
      {t("ratings.again")}
     </Button>
     <Button
      type="button"
      variant="outline"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({
        itemId: item.id,
        rating: "hard",
        expectedRevision: item.revision,
       })
      }
     >
      <kbd className="rounded-md border border-current/20 px-1.5 py-0.5 font-mono text-xs">[2]</kbd>
      {t("ratings.hard")}
     </Button>
     <Button
      type="button"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({
        itemId: item.id,
        rating: "good",
        expectedRevision: item.revision,
       })
      }
     >
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
  </div>
 );
}
