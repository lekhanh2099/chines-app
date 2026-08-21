"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { useClientSession } from "@/components/providers/QueryProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { fetchLearningLoopItems, rateLearningLoopItem } from "./learning-loop-api";

export function LearningLoopWorkspace() {
 const t = useTranslations("LearningLoop");
 const tts = useSharedMandarinTts();
 const { userId, isResolved } = useClientSession();
 const queryClient = useQueryClient();
 const [error, setError] = useState<string | null>(null);
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
  onSuccess: async () => {
   setError(null);
   await queryClient.invalidateQueries({ queryKey: learningLoopKey });
  },
  onError: (caught: Error) => setError(caught.message),
 });
 const item = useMemo(() => query.data?.[0] ?? null, [query.data]);

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
