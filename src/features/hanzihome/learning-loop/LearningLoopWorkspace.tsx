"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { useClientSession } from "@/components/providers/QueryProvider";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";

import {
 LearningLoopCompletionCard,
 LearningLoopEmptyCard,
 LearningLoopReviewCard,
} from "./LearningLoopViews";
import { useLearningLoopKeyboardShortcuts } from "./useLearningLoopKeyboardShortcuts";
import { useLearningLoopQueue } from "./useLearningLoopQueue";
import { useLearningLoopRating } from "./useLearningLoopRating";

export function LearningLoopWorkspace() {
 const t = useTranslations("LearningLoop");
 const tts = useSharedMandarinTts();
 const { userId, isResolved } = useClientSession();
 const { item, learningLoopKey, query } = useLearningLoopQueue({ isResolved, userId });
 const { error, rateMutation, reviewedInSession } = useLearningLoopRating({
  learningLoopKey,
  userId,
 });
 const rateItem = rateMutation.mutate;
 const speakSequence = tts.speakSequence;
 const isTtsLoading = tts.isLoading;

 useLearningLoopKeyboardShortcuts({
  isPending: rateMutation.isPending,
  isQueryError: query.isError,
  isResolved,
  isTtsLoading,
  item,
  rateItem,
  speakSequence,
  userId,
 });

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
   return <LearningLoopCompletionCard reviewedInSession={reviewedInSession} />;
  }

  return <LearningLoopEmptyCard onCheckAgain={() => void query.refetch()} />;
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
   <LearningLoopReviewCard
    item={item}
    dueCount={query.data.length}
    error={error}
    isRating={rateMutation.isPending}
    tts={tts}
    onRate={(rating) =>
     rateMutation.mutate({
      itemId: item.id,
      rating,
      expectedRevision: item.revision,
     })
    }
   />
  </div>
 );
}
