"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientSession } from "@/components/providers/QueryProvider";
import {
 savePracticeAttempt,
 type PracticeAttemptPayload,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { DictationAttempt } from "./dictation-session";
import { dictationMistakeItem, dictationPracticePayload } from "./dictation-workspace-utils";

export function useDictationAttempts() {
 const { userId } = useClientSession();
 const queryClient = useQueryClient();
 const attemptMutation = useMutation({
  mutationFn: (payload: PracticeAttemptPayload) =>
   savePracticeAttempt(payload, { expectedOwnerId: userId ?? undefined }),
 });
 const loopMutation = useMutation({
  mutationFn: upsertLearningLoopItem,
  onSuccess: () =>
   queryClient.invalidateQueries({ queryKey: hanzihomeQueryKeys.learningLoopForUser(userId) }),
 });
 const persistAttempt = (attempt: DictationAttempt) => {
  attemptMutation.reset();
  loopMutation.reset();
  attemptMutation.mutate(dictationPracticePayload(attempt));
  if (attempt.mistakeCount > 0)
   loopMutation.mutate(dictationMistakeItem(attempt, new Date().toISOString()));
 };
 return {
  persistAttempt,
  attemptSaveError: attemptMutation.error?.message ?? loopMutation.error?.message ?? "",
 };
}
